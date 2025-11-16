import { DocumentReference, Timestamp, Firestore, FieldValue } from "firebase-admin/firestore";
import { db, auth } from "../firebase.ts";
import { Request, Response } from "express";
import admin from "firebase-admin";
import { Group, Forum, deleteForumsInGroup, fetchUserData, addUserToCommunity, removeUserFromCommunity } from "./_utils/commUtils.ts";
import { cookieParser, getUserIdFromSessionCookie } from "./_utils/generalUtils.ts";
import { updateCommunityField } from "./users.ts";
import { group } from "console";

// Retrieves all documents in Communities
const getAllDocuments = async (req: Request, res: Response) => {
    try {
        const communitiesRef = db.collection("Communities");
        const snapshot = await communitiesRef.get();
        
        res.status(200).send({
            status: "OK",
            message: snapshot.docs.map(doc => doc.data())
        })
    }
    catch (err) {
        res.status(500).send({
            status: "backend error",
            message: err
        })
    }    
}

// Creates and adds a document in Community, as well as a default Group
const addDoc = async (req: Request, res: Response) => {
    try {
        const { name, description, isPublic }: { name: string; description: string; isPublic: boolean } = req.body;

        // Get userId from sessionCookie
        const userId = await getUserIdFromSessionCookie(req);

        // Clean up community name
        let cleanName = name.trim();                           // remove trailing spaces
        cleanName = cleanName.replace(/[^a-zA-Z0-9-_ ]/g, ""); // Remove special characters except letters, numbers, hyphens, and underscores
        cleanName = cleanName.replace(/\s+/g, "")              // Remove spaces from the name

        const communitiesRef = await db.collection("Communities");
        const snapshot = await communitiesRef.where("name", "==", cleanName).get();

        // Verify if community already exists
        if (!snapshot.empty) {
            console.log("Error: Community already exists.");
            return res.status(400).send({
                status: "Bad Request",
                message: "Community already exists!"
            });
        }
        
        const userRef = db.doc(`/Users/${userId}`);
        const nameLower = cleanName.toLowerCase();

        // Create community
        const data = {
            blacklist: [],                                                              
            dateCreated: Timestamp.fromDate(new Date()),
            description,                                                                
            groupsInCommunity: [],                                                      
            forumsInCommunity: [],      // This is field is for easier querying
            userList: [userRef],                                                        
            modList: [userRef],                                                         
            ownerList: [userRef],                                                       
            name: cleanName,
            nameLower,
            numUsers: 1,                                                                
            public: isPublic,
            banner: "",
            icon: "",
            yayScore: 0,
        }
        const commRef = await communitiesRef.add(data);

        // Create default group "general"
        const groupsRef = db.collection("Groups");
        const generalGroupData = {
            name: "general",
            forumsInGroup: [], 
            parentCommunity: commRef,
        }

        // Update community with default group reference
        const generalGroupRef = await groupsRef.add(generalGroupData);
        await commRef.update({
            groupsInCommunity: admin.firestore.FieldValue.arrayUnion(generalGroupRef),
        });

        // Update user's communities field to include reference to new community
        await userRef.update({
            communities: admin.firestore.FieldValue.arrayUnion(commRef),
        })

        console.log("Successfully created community");
        res.status(201).send({
            status: "ok",
            message: "Successfully added to Communities, " + commRef.id,
            docId: commRef.id,
            commName: cleanName,
        });
    } catch (err) {
        console.log("Failed to add document to Communities");
        res.status(500).send({
            status: "Backend error: Could not add document to Communities",
            message: `Error: ${err instanceof Error ? err.message : String(err)}`,
        });
    } // end try catch
} // end addDoc

const createGroup = async (req: Request, res: Response) => {
    try {
        const { commName, name } = req.body;

        // Verify and get userId from session cookie
        const userId = await getUserIdFromSessionCookie(req);

        const commsRef = db.collection("Communities");
        const commSnap = await commsRef.where("nameLower", "==", commName.toLowerCase()).get();
        if (commSnap.empty) {
            return res.status(404).send({
                status: "Not Found",
                message: "Community not found.",
            });
        }

        const commDoc = commSnap.docs[0];
        const commData = commDoc.data();

        // Verify ownership or mod privileges
        const userRef = await db.doc(`/Users/${userId}`);
        const isOwner = (commData.ownerList || []).some((ref: DocumentReference) => ref.id === userRef.id);
        const isMod   = (commData.modList || []).some((ref: DocumentReference) => ref.id === userRef.id);
        if (!isOwner && !isMod) {
            return res.status(403).send({
                status: "Forbidden",
                message: "Only moderators or owners can create groups.",
            });
        }

        // Create the group
        const groupData = {
            name,                               // name of the group
            forumsInGroup: [],                  // list of forums in the group
            parentCommunity: commDoc.ref,       // reference to parent community in which group belongs 
        }

        const newGroupRef = await db.collection("Groups").add(groupData);
        
        // Link group to community
        await commDoc.ref.update({ groupsInCommunity: admin.firestore.FieldValue.arrayUnion(newGroupRef) });

        res.status(201).send({
            status: "ok",
            message: "Group created successfully.",
            groupId: newGroupRef.id,
        });
    } catch (err) {
        res.status(500).send({
            status: "Backend Error",
            message: err instanceof Error ? err.message : err,
        });
    } // end try catch
} // end createGroup

// Deletes a group, all its forums, posts, and replies
const deleteGroup = async (req: Request, res: Response) => {
    try {
        const { groupId } = req.params;
        const { commName } = req.body;

        // Verify and get userId from session cookie
        const userId = await getUserIdFromSessionCookie(req);

        if (!commName || !userId) {
            console.log("No community or user provided.");
            return res.status(400).send({
                status: "Bad Request",
                message: "Missing community name or user ID in request.",
            });
        }

        const groupRef = db.collection("Groups").doc(groupId);
        const groupSnap = await groupRef.get();

        if (!groupSnap.exists) {
            return res.status(404).json({
                status: "Not Found",
                message: "Group not found",
            });
        }

        // Convert the name to lowercase
        const nameLower = commName.toLowerCase();

        // Find community by name
        const commRef = db.collection("Communities");
        const snapshot = await commRef.where("nameLower", "==", nameLower).get();
        if (snapshot.empty) {
            console.log(`No community found with name "${commName}".`);
            return res.status(404).send({
                status: "Not Found",
                message: `No community found with name "${commName}".`,
            });
        }
        console.log(`Found community "${commName}".`);

        const doc = snapshot.docs[0];
        const commData = doc.data();

        // Check if requester is an owner or mod
        const userRef = db.doc(`/Users/${userId}`)
        const ownerList: FirebaseFirestore.DocumentReference[] = commData.ownerList || [];
        const modList: FirebaseFirestore.DocumentReference[] = commData.modList || [];
        let isOwner = ownerList.some(ref => ref.path === userRef.path);
        let isMod = modList.some(ref=> ref.path === userRef.path);

        if (!isOwner && !isMod) {
            console.log(`User with ID ${userId} is unauthorized to delete this group.`);
            return res.status(403).send({
                status: "Forbidden",
                message: "You are not authorized to delete this group.",
            });
        }
        console.log(`Confirmed user with ID ${userId} is ${isOwner ? "an owner" : "a moderator"} of community "${commName}".`);


        const groupData = groupSnap.data();

        // --- Delete all group children ---
        console.log("Deleting forums, posts, and replies within group...");

        await deleteForumsInGroup(groupRef);    // This will delete all forums, posts, and replies within the group

        console.log("All forums, posts, and replies within group deleted.");

        // --- Dereference the group from its parent community ---
        console.log("Dereferencing group from parent community...");
        const parentCommunityRef: DocumentReference | undefined = groupData?.parentCommunity;
        if (parentCommunityRef) {
            await parentCommunityRef.update({
                groupsInCommunity: FieldValue.arrayRemove(groupRef)
            });
        }
        console.log("Group reference removed from parent community.");

        // --- Delete the group itself ---
        console.log("Deleting group...");
        await groupRef.delete();
        console.log("Group deleted.");

        res.status(200).json({
            status: "ok",
            message: `Group ${groupId} and all its forums, posts & replies deleted successfully`,
        });

    } catch (err) {
        console.error("Error deleting group:", err);
        res.status(500).json({
            status: "Backend error",
            message: err instanceof Error ? err.message : err,
        });
    }
};


// User joins a community's userList, community is added to user's communities field
const joinCommunity = async (req: Request, res: Response) => {
    try {
        // const { userId } = req.body;
        const { name } = req.params;

        // Verify and get userId from session cookie
        const userId = await getUserIdFromSessionCookie(req);
        if (!name || !userId) {
            console.log("Missing community name or user ID in request.");
            return res.status(400).send({
                status: "Bad Request",
                message: "Missing community name or user ID in request."
            });
        }

        // convert the community name to lowercase
        const nameLower = name.toLowerCase();

        // Find community by nameLower
        const commsRef = db.collection("Communities");
        const snapshot = await commsRef.where("nameLower", "==", nameLower).get();
        if (snapshot.empty) {
            console.log(`No community found with name "${name}"`);
            return res.status(404).send({
                status: "Not Found",
                message: `No community found with name "${name}"`,
            });
        }

        const commDoc = snapshot.docs[0];
        const commRef = commDoc.ref;
        const userRef = db.collection("Users").doc(userId);

        // Add user to community's userList and community to user's communities field
        await addUserToCommunity(commRef, userRef, userId, name);

        console.log(`User ${userId} successfully joined community ${name}`);
        return res.status(200).send({
            status: "Success",
            message: `User ${userId} successfully joined community ${name}`,
        });
    } catch (err) {
        if (err instanceof Error) {
            if (err.message === "User is already a member of this community") {
                return res.status(400).send({ 
                    status: "Conflict", 
                    message: err.message 
                });
            }
            if (err.message === "User not found") {
                return res.status(404).send({ 
                    status: "Not Found", 
                    message: err.message 
                });
            }
        } else {
            return res.status(500).send({
                status: "Error",
                message: "Failed to join community",
                error: err,
            });
        } // end if else
    } // end try catch
} // end function joinCommunity

// User leaves a community's userList, community is removed from user's communities field
const leaveCommunity = async (req: Request, res: Response) => {
    try {
        const { name } = req.params;

        // Verify and get userId from session cookie
        const userId = await getUserIdFromSessionCookie(req);
        if (!name || !userId) {
            console.log("Missing community name or user ID in request.");
            return res.status(400).send({
                status: "Bad Request",
                message: "Missing community name or user ID in request."
            });
        }

        // Convert community name to lowercase
        const nameLower = name.toLowerCase();

        // Find community document
        const commsRef = db.collection("Communities");
        const snapshot = await commsRef.where("nameLower", "==", nameLower).get();

        if (snapshot.empty) {
            console.log(`No community found with name "${name}".`);
            return res.status(404).send({
                status: "Not Found",
                message: `No community found with name "${name}".`
            });
        }

        const commDoc = snapshot.docs[0];
        const commRef = commDoc.ref;
        const userRef = db.collection("Users").doc(userId);


        // Remove user from community
        await removeUserFromCommunity(commRef, userRef, userId, name);

        console.log(`User ${userId} successfully left community ${name}`);
        return res.status(200).send({
            status: "ok",
            message: `User ${userId} successfully left community ${name}`,
        });
    } catch (err) {
        console.error("Error leaving community:", err);

        if (err instanceof Error) {
            if (err.message === "User is not a member of this community") {
                return res.status(400).send({ status: "Conflict", message: err.message });
            }
            if (err.message === "User not found" || err.message.includes("Community data not found")) {
                return res.status(404).send({ status: "Not Found", message: err.message });
            }
            if (err.message.includes("only owner")) {
                return res.status(403).send({ status: "Forbidden", message: err.message });
            }
        } // end if

        return res.status(500).send({
            status: "Error",
            message: "Failed to leave community",
            error: err instanceof Error ? err.message : err,
        });
    } // end try catch
} // end leaveCommunity

// Deletes a document in Communities by the community name, provided that the request is from one of the community's owners
const deleteDoc = async (req: Request, res: Response) => {
    try {
        // const { userId } = req.body;
        const { name } = req.params;

        // Verify and get userId from session cookie
        const userId = await getUserIdFromSessionCookie(req);
        if (!name || !userId) {
            console.log("No community or user provided.");
            return res.status(400).send({
                status: "Bad Request",
                message: "Missing community name or user ID in request.",
            });
        }

        // Convert the name to lowercase
        const nameLower = name.toLowerCase();

        // Find community by name
        const commRef = db.collection("Communities");
        const snapshot = await commRef.where("nameLower", "==", nameLower).get();
        if (snapshot.empty) {
            console.log(`No community found with name "${name}".`);
            return res.status(404).send({
                status: "Not Found",
                message: `No community found with name "${name}".`,
            });
        }
        console.log(`Found community "${name}".`);

        const doc = snapshot.docs[0];
        const commData = doc.data();

        // Check if requester is an owener
        const userRef = db.doc(`/Users/${userId}`)
        const ownerList: FirebaseFirestore.DocumentReference[] = commData.ownerList || [];
        let isOwner = ownerList.some(ref => ref.path === userRef.path);

        if (!isOwner) {
            console.log(`User with ID ${userId} is unauthorized to delete this community.`);
            return res.status(403).send({
                status: "Forbidden",
                message: "You are not authorized to delete this community.",
            });
        }
        console.log(`Confirmed user with ID ${userId} is an owner of community "${name}".`);
        
        // Dereference community from all community users 'communities' field
        console.log("Dereferencing community from each user in the community...");
        const userList: FirebaseFirestore.DocumentReference[] = commData.userList || [];
        const batch = db.batch();
        for (const userRef of userList) {
            batch.update(userRef, {
                communities: admin.firestore.FieldValue.arrayRemove(commData.name),
            });
        }
        await batch.commit();
        console.log("Successfully dereferenced community from all users in the community.");

        // Delete all groups, forums, posts, and replies in the community
        console.log("Deleting all groups, forums, posts, and replies...");
        const groups: FirebaseFirestore.DocumentReference[] = commData.groupsInCommunity || [];
        for (const groupRef of groups) {
            await deleteForumsInGroup(groupRef); // Function that deletes all forums, posts, and nested replies
            await groupRef.delete();
        }
        console.log("Delete success.");

        // Delete the community document
        console.log("Deleting community...");
        await doc.ref.delete();
        console.log(`Community with name ${name} successfully deleted by user with ID ${userId}.`);

        return res.status(200).send({
            status: "ok",
            message: `Community '${name}' successfully deleted.`,
        });        
    } catch (err) {
        console.error("Error deleting community:", err);
        return res.status(500).send({
            status: "Backend Error",
            message: "Could not delete community.",
            error: err instanceof Error ? err.message : err,
        });
    } // end try catch
} // end deleteDoc

// Promote a user to mod
const promoteToMod = async (req: Request, res: Response) => {
    try {
        const { name } = req.params;
        const { userId: targetId } = req.body; // This is the uid of the user being promoted.

        // Verify and get userId from session cookie
        const ownerId = await getUserIdFromSessionCookie(req);

        if (!name || !targetId) {
            return res.status(400).send({ message: "Missing community name or target user ID" });
        }

        const commRef = db.collection("Communities");
        const snapshot = await commRef.where("nameLower", "==", name.toLowerCase()).get();
        if (snapshot.empty) {
            return res.status(404).send({ message: `Community "${name}" not found` });
        }

        const commDoc = snapshot.docs[0];
        const commData = commDoc.data();
        const commRefDoc = commDoc.ref;

        const ownerList: FirebaseFirestore.DocumentReference[] = commData.ownerList || [];
        const userRef = db.doc(`/Users/${ownerId}`);
        const targetRef = db.doc(`/Users/${targetId}`);

        // Only owners can promote
        const isOwner = ownerList.some(ref => ref.path === userRef.path);
        if (!isOwner) {
            return res.status(403).send({ message: "Only owners can promote users to moderators" });
        }

        // Make sure target user exists in userList
        const userList: FirebaseFirestore.DocumentReference[] = commData.userList || [];
        const isMember = userList.some(ref => ref.path === targetRef.path);
        if (!isMember) {
            return res.status(400).send({ message: "Target user is not a member of this community" });
        }
        
        // Promote the target user by adding them to modList
        await commRefDoc.update({
            modList: FieldValue.arrayUnion(targetRef)
        });
        return res.status(200).send({ message: `User ${targetId} successfully promoted to moderator` });
    } catch (err) {
        console.error("Error promoting user to mod:", err);
        return res.status(500).send({
            message: "Failed to promote user to moderator",
            error: err instanceof Error ? err.message : String(err),
        });
    } // end try catch
} // end promoteToMod

// Demote a user from mod
const demoteMod = async (req: Request, res: Response) => {
    try {
        const { name } = req.params;
        const { userId: targetId } = req.body; // UID of the user being demoted

        // Verify and get owner UID from session cookie
        const ownerId = await getUserIdFromSessionCookie(req);

        if (!name || !targetId) {
            return res.status(400).send({ message: "Missing community name or target user ID" });
        }

        const commRef = db.collection("Communities");
        const snapshot = await commRef.where("nameLower", "==", name.toLowerCase()).get();

        if (snapshot.empty) {
            return res.status(404).send({ message: `Community "${name}" not found` });
        }

        const commDoc = snapshot.docs[0];
        const commData = commDoc.data();
        const commRefDoc = commDoc.ref;

        const ownerList: FirebaseFirestore.DocumentReference[] = commData.ownerList || [];
        const userRef = db.doc(`/Users/${ownerId}`);
        const targetRef = db.doc(`/Users/${targetId}`);

        // Only owners can demote
        const isOwner = ownerList.some(ref => ref.path === userRef.path);
        if (!isOwner) {
            return res.status(403).send({ message: "Only owners can demote moderators" });
        }

        // Prevent demoting an owner (owners are always mods)
        const isTargetOwner = ownerList.some(ref => ref.path === targetRef.path);
        if (isTargetOwner) {
            return res.status(400).send({ message: "Cannot demote an owner from mod." });
        }

        // Remove the target user from modList
        await commRefDoc.update({
            modList: FieldValue.arrayRemove(targetRef)
        });

        return res.status(200).send({ message: `User ${targetId} successfully demoted from moderator` });
    } catch (err) {
        console.error("Error demoting user from mod:", err);
        return res.status(500).send({
            message: "Failed to demote user from moderator",
            error: err instanceof Error ? err.message : String(err),
        });
    } // end try catch
} // end function demoteMod

// Promote a user to owner
const promoteToOwner = async (req: Request, res: Response) => {
    try {
        const { name } = req.params;
        const { userId: targetId } = req.body; // UID of the user being promoted

        // Verify session cookie
        const ownerId = await getUserIdFromSessionCookie(req);

        if (!name || !targetId) {
            return res.status(400).send({ message: "Missing community name or target user ID" });
        }

        // Fetch community
        const commRefSnap = await db.collection("Communities")
            .where("nameLower", "==", name.toLowerCase())
            .get();
        if (commRefSnap.empty) {
            return res.status(404).send({ message: `Community "${name}" not found` });
        }

        const commDoc = commRefSnap.docs[0];
        const commData = commDoc.data();
        const commRefDoc = commDoc.ref;

        const ownerList: FirebaseFirestore.DocumentReference[] = commData.ownerList || [];
        const userList: FirebaseFirestore.DocumentReference[] = commData.userList || [];
        const ownerRef = db.doc(`/Users/${ownerId}`);
        const targetRef = db.doc(`/Users/${targetId}`);

        // Only current owners can promote
        const isOwner = ownerList.some(ref => ref.path === ownerRef.path);
        if (!isOwner) {
            return res.status(403).send({ message: "Only owners can promote other users to owner" });
        }

        // Target must be a member
        const isMember = userList.some(ref => ref.path === targetRef.path);
        if (!isMember) {
            return res.status(400).send({ message: "Target user is not a member of the community" });
        }

        // Promote to owner
        await commRefDoc.update({
            ownerList: FieldValue.arrayUnion(targetRef),
            modList: FieldValue.arrayUnion(targetRef),
        });

        return res.status(200).send({ message: `User ${targetId} promoted to owner successfully` });
    } catch (err) {
        console.error("Error promoting user to owner:", err);
        return res.status(500).send({
            message: "Failed to promote user to owner",
            error: err instanceof Error ? err.message : String(err),
        });
    } // end try catch
} // end promoteToOwner

// Demote an owner
const demoteOwner = async (req: Request, res: Response) => {
    try {
        const { name } = req.params;
        const { userId: targetId } = req.body; // UID of the owner being demoted

        // Verify session cookie
        const ownerId = await getUserIdFromSessionCookie(req);

        if (!name || !targetId) {
            return res.status(400).send({ message: "Missing community name or target user ID" });
        }

        // Fetch community
        const commRefSnap = await db.collection("Communities")
            .where("nameLower", "==", name.toLowerCase())
            .get();
        if (commRefSnap.empty) {
            return res.status(404).send({ message: `Community "${name}" not found` });
        }

        const commDoc = commRefSnap.docs[0];
        const commData = commDoc.data();
        const commRefDoc = commDoc.ref;

        const ownerList: FirebaseFirestore.DocumentReference[] = commData.ownerList || [];
        const ownerRef = db.doc(`/Users/${ownerId}`);
        const targetRef = db.doc(`/Users/${targetId}`);

        // Only current owners can demote
        const isOwner = ownerList.some(ref => ref.path === ownerRef.path);
        if (!isOwner) {
            return res.status(403).send({ message: "Only owners can demote owners" });
        }

        // Check if target is an owner
        const isTargetOwner = ownerList.some(ref => ref.path === targetRef.path);
        if (!isTargetOwner) {
            return res.status(400).send({ message: "Target user is not an owner" });
        }

        // If the target is demoting themselves, ensure at least one other owner remains
        if (targetId === ownerId && ownerList.length <= 1) {
            return res.status(400).send({ message: "You cannot demote yourself as the only owner" });
        }

        // Demote owner (they may remain a mod if applicable)
        await commRefDoc.update({
            ownerList: FieldValue.arrayRemove(targetRef),
        });

        return res.status(200).send({ message: `User ${targetId} demoted from owner successfully` });
    } catch (err) {
        console.error("Error demoting owner:", err);
        return res.status(500).send({
            message: "Failed to demote owner",
            error: err instanceof Error ? err.message : String(err),
        });
    } // end try catch
} // end demoteOwner

// Retrieves a document in Community by exact name (case sensitive)
const getDocByName = async (req: Request, res: Response) => {
    try {
        const query = req.params.name;
        const communitiesRef = await db.collection("Communities");
        const snapshot = await communitiesRef.where("name", "==", query).get();

        if (snapshot.empty) {
            res.status(404).send({
                status: "Not found",
                message: "Cannot find document with name: " + query
            })
        }
        
        res.status(200).send({
            status: "OK",
            message: snapshot.docs.map(doc => doc.data())
        })
    }
    catch (err) {
        res.status(500).send({
            status: "Backend error",
            message: err
        })
    }
}

// Retrieve documents in Communities that contain the prefix value
const prefixSearch = async (req: Request, res: Response) => {
    try {
        const query = req.params.query.toLowerCase();
        if (!query) {
            res.status(400).send({
                status: "Bad Request",
                message: "Empty query!"
            })
        }
        
        const communitiesRef = db.collection("Communities").where("nameLower", ">=", query).where("nameLower", "<=", query + "\uf8ff");
        const snapshot = await communitiesRef.get();
        
        res.status(200).send({
            status: "OK",
            message: snapshot.docs.map(doc => doc.data())
        });
    }
    catch (err) {
        res.status(500).send({
            status: "Backend error",
            message: err
        })
    }
}

// Updates the blacklist of an existing document
const updateDoc = async (req: Request, res: Response) => {
    //TODO: Complete code stub
}

// Update a community's data
const editComm = async (req: Request, res: Response) => {
    try {
        const { name } = req.params; // community name
        const { description, isPublic } = req.body;
        let { newName } = req.body; // new community name

        // Verify and get userId from session cookie
        const userId = await getUserIdFromSessionCookie(req);
        
        if (!name || !userId) {
            console.log("No community or user provided.");
            return res.status(400).send({
                status: "Bad Request",
                message: "Missing community name or user ID in request.",
            });
        }

        // Verify if user is an owner of the community
        const commsRef = db.collection("Communities");
        const snapshot = await commsRef.where("nameLower", "==", name.toLowerCase()).get();
        if (snapshot.empty) {
            console.log(`No community found with name "${name}".`);
            return res.status(404).send({
                status: "Not Found",
                message: `No community found with name "${name}".`,
            });
        }
        const doc = snapshot.docs[0];
        const commData = doc.data();
        const userRef = db.doc(`/Users/${userId}`);
        const ownerList: FirebaseFirestore.DocumentReference[] = commData.ownerList || [];
        let isOwner = ownerList.some(ref => ref.path === userRef.path);
        if (!isOwner) {
            console.log(`User with ID ${userId} is unauthorized to edit this community.`);
            return res.status(403).send({
                status: "Forbidden",
                message: "You are not authorized to edit this community.",
            });
        }

        // If data sent does not change anything, return message
        if (
            (description === undefined || description === commData.description) &&
            (isPublic === undefined || isPublic === commData.public) &&
            (newName === undefined || newName === name) 
        ) {
            console.log("No changes detected in the update request.");
            return res.status(200).send({
                status: "ok",
                message: "No changes detected in the update request.",
            });
        }

        // Prepare update data
        const updates: Partial<{ name: string; nameLower: string; description: string; public: boolean }> = {}
        if (description !== undefined) updates.description = description;
        if (isPublic !== undefined) updates.public = isPublic;

        // Verify newName uniqueness if it is being changed
        if (newName && newName !== name) {
            const newNameLower = newName.toLowerCase();
            const nameCheckSnap = await commsRef.where("nameLower", "==", newNameLower).get();
            if (!nameCheckSnap.empty) {
                console.log(`Community name "${newName}" is already taken.`);
                return res.status(409).send({
                    status: "Conflict",
                    message: `Community name "${newName}" is already taken.`,
                });
            }

            // Set name updates
            updates.name = newName;
            updates.nameLower = newNameLower;
        }
        
        // Update community document
        await doc.ref.update(updates);
        console.log(`Community "${name}" successfully updated.`);
        res.status(200).send({
            status: "ok",
            message: `Community "${name}" successfully updated.`,
        });
    } catch (err) {
        res.status(500).send({
            status: "Backend error",
            message: err instanceof Error ? err.message : String(err),
        });
    }
}

// Edit a group within a community
const editGroup = async (req: Request, res: Response) => {
    try {
        const { groupId } = req.params;
        const { commName, newName } = req.body;

        // Verify and get userId from session cookie
        const userId = await getUserIdFromSessionCookie(req);
        // Verify ownership or mod privileges
        const commsRef = db.collection("Communities");
        const commSnap = await commsRef.where("nameLower", "==", commName.toLowerCase()).get();
        if (commSnap.empty) {
            return res.status(404).send({
                status: "Not Found",
                message: "Community not found.",
            });
        }
        const commDoc = commSnap.docs[0];
        const commData = commDoc.data();
        const userRef = await db.doc(`/Users/${userId}`);
        const isOwner = (commData.ownerList || []).some((ref: DocumentReference) => ref.id === userRef.id);
        const isMod   = (commData.modList || []).some((ref: DocumentReference) => ref.id === userRef.id);
        if (!isOwner && !isMod) {
            return res.status(403).send({
                status: "Forbidden",
                message: "Only moderators or owners can edit groups.",
            });
        }

        // End if newName is the same as current name
        const groupRefCheck = db.collection("Groups").doc(groupId);
        const groupSnapCheck = await groupRefCheck.get();
        if (groupSnapCheck.data()?.name === newName) {
            return res.status(200).send({
                status: "ok",
                message: "No changes detected in the update request.",
            });
        }

        // Verify no other group in the community has the newName
        const groupsRefs = commData.groupsInCommunity || [];
        for (const groupRef of groupsRefs) {
            const groupSnap = await groupRef.get();
            if (!groupSnap.exists) continue;
            const groupData = groupSnap.data();
            if (groupData.name === newName) {
                return res.status(409).send({
                    status: "Conflict",
                    message: `A group with the name "${newName}" already exists in this community.`,
                });
            }
        }

        // Update the group name
        const groupRef = db.collection("Groups").doc(groupId);
        await groupRef.update({ name: newName });
        res.status(200).send({
            status: "ok",
            message: `Group name updated to "${newName}" successfully.`,
        });
    } catch(err) {
        res.status(500).send({
            status: "Backend Error",
            message: err instanceof Error ? err.message : String(err),
        });
    } // end try catch
} // end editGroup

const getCommunityStructure = async (req: Request, res: Response) => {
    try {
        const communityName = req.params.name;

        // Get community document
        const communitiesRef = db.collection("Communities");
        const snapshot = await communitiesRef.where("name", "==", communityName).get();

        if (snapshot.empty) {
            return res.status(404).send({
                status: "Not found",
                message: `Community of name "${communityName}" not found.`,
            });
        }

        const communityDoc = snapshot.docs[0];
        const communityData = communityDoc.data();
        const groupsRefs = communityData.groupsInCommunity || [];

        // Fetch user data for community lists
        const ownerList = await fetchUserData(communityData.ownerList || []);
        const modList = await fetchUserData(communityData.modList || []);
        const userList = await fetchUserData(communityData.userList || []);

        // Fetch all groups
        const groupsInCommunity: Group[] = [];
        for (const groupRef of groupsRefs) {
            const groupSnap = await groupRef.get();
            if (!groupSnap.exists) continue;

            const groupData = groupSnap.data();
            const forumsRefs = groupData.forumsInGroup || [];

            // Fetch all forums for the current group
            const forumsInGroup: Forum[] = [];
            for (const forumRef of forumsRefs) {
                const forumSnap = await forumRef.get();
                if (!forumSnap.exists) continue;
                forumsInGroup.push({ id: forumSnap.id, ...forumSnap.data() }); 
            } // end for forumsRefs

            groupsInCommunity.push({
                id: groupSnap.id,
                ...groupData,
                forumsInGroup,
            });
        } // end for groupsRefs

        res.status(200).send({
            status: "ok",
            community: {
                id: communityDoc.id,
                name: communityData.name,
                description: communityData.description,
                public: communityData.public,
                ownerList,
                modList,
                userList,
                groupsInCommunity,
            },
        });
    } catch (err) {
        console.error("Error fetching community structure:", err);
        res.status(500).send({
            status: "Backend error",
            message: err instanceof Error? err.message : err,
        });
    } // end try catch
} // end getCommunityStructure


export {
    getAllDocuments,
    prefixSearch,
    addDoc,
    getDocByName,
    updateDoc,
    getCommunityStructure,
    deleteDoc,
    createGroup,
    deleteGroup,
    joinCommunity,
    leaveCommunity,
    promoteToMod,
    demoteMod,
    promoteToOwner,
    demoteOwner,
    editComm,
    editGroup
}
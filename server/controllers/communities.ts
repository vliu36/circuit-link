import { DocumentReference, Timestamp, Firestore, FieldValue, DocumentData } from "firebase-admin/firestore";
import { db, auth } from "../firebase.ts";
import { Request, Response } from "express";
import admin from "firebase-admin";
import * as commUtil  from "./_utils/commUtils.ts";
import * as genUtil from "./_utils/generalUtils.ts";
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

// Creates and adds a document in Communities, as well as a default Group
const addDoc = async (req: Request, res: Response) => {
    try {
        const { name, description, isPublic }: { name: string; description: string; isPublic: boolean } = req.body;

        // Get userId from sessionCookie
        const userId = await genUtil.getUserIdFromSessionCookie(req);

        // Clean up community name
        let cleanName = name.trim();                           // remove trailing spaces
        cleanName = cleanName.replace(/[^a-zA-Z0-9-_ ]/g, ""); // Remove special characters except letters, numbers, hyphens, and underscores
        cleanName = cleanName.replace(/\s+/g, "")              // Remove spaces from the name

        // Verify if community already exists
        const communitiesRef = await db.collection("Communities");
        const snapshot = await communitiesRef.where("name", "==", cleanName).get();
        if (!snapshot.empty) {
            console.log("Error: Community already exists.");
            return res.status(400).send({
                status: "Bad Request",
                message: "Community already exists!"
            });
        }
        
        // --- Setting up community data --- //
        // Get the reference of the user creating the community and lowercase name 
        const userRef = db.doc(`/Users/${userId}`);
        const nameLower = cleanName.toLowerCase();

        // Create a default group "general" within the community
        const groupsRef = db.collection("Groups");
        const generalGroupData = {
            name: "general",
            forumsInGroup: [], 
            parentCommunity: null, // to be updated after community creation
        }
        const generalGroupRef = await groupsRef.add(generalGroupData);
        
        // Create the community, including reference to default group
        const data = {
            blacklist: [],                                                              
            dateCreated: Timestamp.fromDate(new Date()),
            description,                                                                
            groupsInCommunity: [generalGroupRef],
            forumsInCommunity: [],      // This is field is for easier querying
            userList: [userRef],                                                        
            modList: [userRef],                                                         
            ownerList: [userRef],                                                       
            name: cleanName,
            nameLower,
            numUsers: 1,                                                                
            public: isPublic,
            banner: "https://storage.googleapis.com/circuit-link.firebasestorage.app/images/default_banner.png",
            icon: "https://storage.googleapis.com/circuit-link.firebasestorage.app/images/default_icon.jpeg",
            yayScore: 0,
            rules: "Be respectful to others. No spam or self-promotion.",
        }
        const commRef = await communitiesRef.add(data);

        // Backfill the parentCommunity field in the default group
        await generalGroupRef.update({ parentCommunity: commRef });

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
        const userId = await genUtil.getUserIdFromSessionCookie(req);

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
        const { isOwner, isMod } = await genUtil.verifyUserIsOwnerOrMod(commData, userId);
        if (!isOwner && !isMod) {
            console.log("User is not authorized to create groups in this community.");
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
        const userId = await genUtil.getUserIdFromSessionCookie(req);

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

        // Find community by name
        const { data: commData } = await commUtil.getCommunityByName(commName);
        console.log(`Found community "${commName}".`);

        // Check if requester is an owner or mod
        await genUtil.verifyUserIsOwnerOrMod(commData, userId);
        console.log(`Confirmed user with ID ${userId} is authorized to delete community "${commName}".`);

        const groupData = groupSnap.data();

        // --- Delete all group children ---
        console.log("Deleting forums, posts, and replies within group...");
        await commUtil.deleteForumsInGroup(groupRef);    // This will delete all forums, posts, and replies within the group
        console.log("All forums, posts, and replies within group deleted.");

        // --- Dereference the group from its parent community ---
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
        const { name } = req.params;

        // Verify and get userId from session cookie
        const userId = await genUtil.getUserIdFromSessionCookie(req);
        if (!name || !userId) {
            console.log("Missing community name or user ID in request.");
            return res.status(400).send({
                status: "Bad Request",
                message: "Missing community name or user ID in request."
            });
        }

        // Get community by name
        const { ref: commRef } = await commUtil.getCommunityByName(name);

        const userRef = db.collection("Users").doc(userId);

        // Add user to community's userList and community to user's communities field
        await commUtil.addUserToCommunity(commRef, userRef, userId, name);

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
        const userId = await genUtil.getUserIdFromSessionCookie(req);
        if (!name || !userId) {
            console.log("Missing community name or user ID in request.");
            return res.status(400).send({
                status: "Bad Request",
                message: "Missing community name or user ID in request."
            });
        }

        // Get community by name
        const { ref: commRef } = await commUtil.getCommunityByName(name);
        const userRef = db.collection("Users").doc(userId);

        // Remove user from community
        await commUtil.removeUserFromCommunity(commRef, userRef, userId);

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
        const userId = await genUtil.getUserIdFromSessionCookie(req);
        if (!name || !userId) {
            console.log("No community or user provided.");
            return res.status(400).send({
                status: "Bad Request",
                message: "Missing community name or user ID in request.",
            });
        }

        // Get community by name
        const { ref: commRef, data: commData } = await commUtil.getCommunityByName(name);

        // Check if requester is an owner
        const { isOwner } = await genUtil.verifyUserIsOwnerOrMod(commData, userId, true); // true indicates ONLY owner check

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
            await commUtil.deleteForumsInGroup(groupRef); // Function that deletes all forums, posts, and nested replies
            await groupRef.delete();
        }
        console.log("Delete success.");

        // Delete the community document
        console.log("Deleting community...");
        await commRef.delete();
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
        const ownerId = await genUtil.getUserIdFromSessionCookie(req);
        if (!name || !targetId) {
            return res.status(400).send({ message: "Missing community name or target user ID" });
        }

        // Get community by name
        const { ref: commRef, data: commData } = await commUtil.getCommunityByName(name);

        const ownerList: FirebaseFirestore.DocumentReference[] = commData.ownerList || [];
        const userRef = db.doc(`/Users/${ownerId}`);
        const targetRef = db.doc(`/Users/${targetId}`);

        // Only owners can promote
        await genUtil.verifyUserIsOwnerOrMod(commData, ownerId, true); // true indicates ONLY owner check

        // Make sure target user exists in userList
        const userList: FirebaseFirestore.DocumentReference[] = commData.userList || [];
        const isMember = userList.some(ref => ref.path === targetRef.path);
        if (!isMember) {
            return res.status(400).send({ message: "Target user is not a member of this community" });
        }
        
        // Promote the target user by adding them to modList
        await commRef.update({
            modList: FieldValue.arrayUnion(targetRef)
        });
        console.log(`User ${targetId} promoted to moderator in community ${name} by owner ${ownerId}.`);
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
        const ownerId = await genUtil.getUserIdFromSessionCookie(req);

        if (!name || !targetId) {
            return res.status(400).send({ message: "Missing community name or target user ID" });
        }

        // Get community by name
        const { ref: commRef, data: commData } = await commUtil.getCommunityByName(name);

        // Retrieve ownerList and target user reference
        const ownerList: FirebaseFirestore.DocumentReference[] = commData.ownerList || [];
        const targetRef = db.doc(`/Users/${targetId}`);

        // Verify requester is an owner; only owners can demote mods
        await genUtil.verifyUserIsOwnerOrMod(commData, ownerId, true); // true indicates ONLY owner check

        // Prevent demoting an owner (owners are always mods)
        const isTargetOwner = ownerList.some(ref => ref.path === targetRef.path);
        if (isTargetOwner) {
            return res.status(400).send({ message: "Cannot demote an owner from mod." });
        }

        // Remove the target user from modList
        await commRef.update({
            modList: FieldValue.arrayRemove(targetRef)
        });
        console.log(`User ${targetId} demoted from moderator in community ${name} by owner ${ownerId}.`);
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
        const ownerId = await genUtil.getUserIdFromSessionCookie(req);

        if (!name || !targetId) {
            return res.status(400).send({ message: "Missing community name or target user ID" });
        }

        // Get community by name
        const { ref: commRef, data: commData } = await commUtil.getCommunityByName(name);
        // Retrieve the list of users in the community and the target user reference
        const userList: FirebaseFirestore.DocumentReference[] = commData.userList || [];
        const targetRef = db.doc(`/Users/${targetId}`);

        // Only current owners can promote
        await genUtil.verifyUserIsOwnerOrMod(commData, ownerId, true); // true indicates ONLY owner check

        // Target must be a member
        const isMember = userList.some(ref => ref.path === targetRef.path);
        if (!isMember) {
            return res.status(400).send({ message: "Target user is not a member of the community" });
        }

        // Promote to owner
        await commRef.update({
            ownerList: FieldValue.arrayUnion(targetRef),
            modList: FieldValue.arrayUnion(targetRef),
        });
        console.log(`User ${targetId} promoted to owner in community ${name} by owner ${ownerId}.`);
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
        const ownerId = await genUtil.getUserIdFromSessionCookie(req);
        if (!name || !targetId) {
            return res.status(400).send({ message: "Missing community name or target user ID" });
        }

        // Get community by name
        const { ref: commRef, data: commData } = await commUtil.getCommunityByName(name);

        const ownerList: FirebaseFirestore.DocumentReference[] = commData.ownerList || [];
        // ! const ownerRef = db.doc(`/Users/${ownerId}`);
        const targetRef = db.doc(`/Users/${targetId}`);

        // Only current owners can demote
        await genUtil.verifyUserIsOwnerOrMod(commData, ownerId, true); // true indicates ONLY owner check

        // Check if target is an owner
        const isTargetOwner = ownerList.some(ref => ref.path === targetRef.path);
        if (!isTargetOwner) {
            return res.status(400).send({ message: "Target user is not an owner" });
        }

        // If the target is somehow demoting themselves, ensure at least one other owner remains
        if (targetId === ownerId && ownerList.length <= 1) {
            return res.status(400).send({ message: "You cannot demote yourself as the only owner" });
        }

        // Demote owner (they may remain a mod if applicable)
        await commRef.update({
            ownerList: FieldValue.arrayRemove(targetRef),
        });
        console.log(`User ${targetId} demoted from owner in community ${name} by owner ${ownerId}.`);
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

// Kick a user from the community
const kickUser = async (req: Request, res: Response) => {
    try {
        const { userId: targetId, commName } = req.body; // UID of the user being kicked
        console.log("Received kick request for user ID:", targetId, "from community:", commName);
        // Verify and get userId from session cookie
        const requesterId = await genUtil.getUserIdFromSessionCookie(req); // UID of the user making the request; must be owner or mod
        if (!commName || !targetId) {
            return res.status(400).send({ message: "Missing community name or target user ID" });
        }

        await commUtil.kickUserLogic(requesterId, targetId, commName);


        console.log(`User ${targetId} kicked from community ${commName} by requester ${requesterId}.`);
        return res.status(200).send({ status: "ok", message: "User kicked successfully" });
    } catch (err) {
        console.error("Error kicking user:", err);
        return res.status(500).send({
            message: "Failed to kick user",
            error: err instanceof Error ? err.message : String(err),
        });
    }
}

// Updates the blacklist of an existing document; this bans a user from the community
const banUser = async (req: Request, res: Response) => {
    try {
        
        const { userId: targetId, commName } = req.body; // UID of the user being banned
        // Verify and get userId from session cookie
        const requesterId = await genUtil.getUserIdFromSessionCookie(req); // UID of the user making the request; must be owner or mod
        console.log("Received ban request for user ID:", targetId, "from community:", commName);
        
        // Kick the user first
        await commUtil.kickUserLogic(requesterId, targetId, commName);

        // Then proceed to ban
        // Get community by name and target user reference
        const { ref: commRef, data: commData } = await commUtil.getCommunityByName(commName);
        const targetRef = db.doc(`/Users/${targetId}`);

        // Add the target user to the blacklist
        await commRef.update({
            blacklist: FieldValue.arrayUnion(targetRef)
        });
        console.log(`User ${targetId} banned from community ${commName}.`);
        return res.status(200).send({ message: `User banned successfully` });
    } catch (err) {
        console.error("Error banning user:", err);
        return res.status(500).send({
            message: "Failed to ban user",
            error: err instanceof Error ? err.message : String(err),
        });
    }
}

// Unban a user from the community; removes them from the blacklist
const unbanUser = async (req: Request, res: Response) => {
    try {
        const { userId: targetId, commName } = req.body; // UID of the user being unbanned
        // Verify and get userId from session cookie
        const requesterId = await genUtil.getUserIdFromSessionCookie(req); // UID of the user making the request; must be owner or mod
        if (!commName || !targetId) {
            return res.status(400).send({ message: "Missing community name or target user ID" });
        }
        // Get community by name
        const { ref: commRef, data: commData } = await commUtil.getCommunityByName(commName);
        await genUtil.verifyUserIsOwnerOrMod(commData, requesterId); // Verify requester is owner or mod

        const targetRef = db.doc(`/Users/${targetId}`);

        // Remove the target user from the blacklist
        await commRef.update({
            blacklist: FieldValue.arrayRemove(targetRef)
        });
        console.log(`User ${targetId} unbanned from community ${commName}.`);
        return res.status(200).send({ message: `User ${targetId} successfully unbanned from community` });
    } catch (err) {
        console.error("Error unbanning user:", err);
        return res.status(500).send({
            message: "Failed to unban user",
            error: err instanceof Error ? err.message : String(err),
        });
    }
}

// Get the list of users in a community's blacklist
const getBlacklist = async (req: Request, res: Response) => {
    try {
        const { commName } = req.params;
        // Get community by name
        const { data: commData } = await commUtil.getCommunityByName(commName);

        // Retrieve blacklist references
        const blacklistRefs: FirebaseFirestore.DocumentReference[] = Array.isArray(commData?.blacklist) ? commData.blacklist : [];
        const blacklist: DocumentData[] = [];

        // Retrieve user data for each blacklisted user
        for (const userRef of blacklistRefs) {
            const userSnap = await userRef.get();
            if (userSnap.exists) {
                const data = userSnap.data();
                if (data) blacklist.push(data);
            }
        }
        return res.status(200).send({ blacklist });
    } catch (err) {
        console.error("Error getting blacklist:", err);
        return res.status(500).send({
            message: "Failed to get blacklist",
            error: err instanceof Error ? err.message : String(err),
        });
    }
}

// Report a user's post to the community moderators and owners
const reportPost = async (req: Request, res: Response) => {
    try {
        const { commName, postId, reason } = req.body;
        // Verify and get userId from session cookie
        const reporterId = await genUtil.getUserIdFromSessionCookie(req);
        if (!commName || !postId || !reason) {
            return res.status(400).send({ message: "Missing community name, post ID, or reason" });
        }
        // Get reporter's username
        const reporterRef = db.doc(`/Users/${reporterId}`);
        const reporterSnap = await reporterRef.get();
        const reporterData = reporterSnap.data();
        const reporterUsername = reporterData?.username || "Unknown User";

        // Get all moderators and owners of the community
        const { data: commData } = await commUtil.getCommunityByName(commName);
        const modRefs: FirebaseFirestore.DocumentReference[] = commData.modList || [];
        
        // ! Removed - owners are already included in modList, this causes duplicate ids
        // ! This comment is kept for reference in case we need to revert
        // const ownerRefs: FirebaseFirestore.DocumentReference[] = commData.ownerList || [];
        // const recipientRefs = Array.from(new Set([...modRefs, ...ownerRefs])); // Combine and deduplicate
        // // Retrieve a string array of recipient IDs
        // const recipientIds = recipientRefs.map(ref => ref.id);

        // Retrieve a string array of mod IDs
        const recipientIds = Array.from(new Set(modRefs.map(ref => ref.id))); 

        // Create notification and send to each recipient
        genUtil.createNotification({
            senderId: reporterId,
            recipientIds: recipientIds,
            type: "report",
            message: `Post ${postId} from "${commName}" reported by user ${reporterUsername} for reason: "${reason}"`,
            relatedDocRef: db.collection("Posts").doc(postId),
        });

        console.log(`Post ${postId} reported to moderators and owners of community ${commName} by user ${reporterId}.`);
        return res.status(200).send({ message: "Post reported successfully" });
    } catch (err) {
        console.error("Error reporting post:", err);
        return res.status(500).send({
            message: "Failed to report post",
            error: err instanceof Error ? err.message : String(err),
        });
    }
}

// Update a community's data
const editComm = async (req: Request, res: Response) => {
    try {
        let { name } = req.params; // community name
        const { description, isPublic, rules } = req.body;
        let { newName } = req.body; // new community name

        // Clean up community name
        let cleanName = name.trim();                           // remove trailing spaces
        cleanName = cleanName.replace(/[^a-zA-Z0-9-_ ]/g, ""); // Remove special characters except letters, numbers, hyphens, and underscores
        cleanName = cleanName.replace(/\s+/g, "")              // Remove spaces from the name

        // Verify and get userId from session cookie
        const userId = await genUtil.getUserIdFromSessionCookie(req);
        
        if (!name || !userId) {
            console.log("No community or user provided.");
            return res.status(400).send({
                status: "Bad Request",
                message: "Missing community name or user ID in request.",
            });
        }

        // Verify if user is an owner of the community
        const { ref: commRef, data: commData } = await commUtil.getCommunityByName(name);
        await genUtil.verifyUserIsOwnerOrMod(commData, userId, true); // true indicates ONLY owner check

        const commsRef = db.collection("Communities"); // Reference to Communities collection, different from commRef which is specific community

        // If data sent does not change anything, return message
        if (
            (description === undefined || description === commData.description) &&
            (isPublic === undefined || isPublic === commData.public) &&
            (newName === undefined || newName === cleanName) &&
            (rules === undefined || rules === commData.rules)
        ) {
            console.log("No changes detected in the update request.");
            return res.status(200).send({
                status: "ok",
                message: "No changes detected in the update request.",
            });
        }

        // Prepare update data
        const updates: Partial<{ name: string; nameLower: string; description: string; public: boolean; rules: string }> = {}
        if (description !== undefined) updates.description = description;
        if (isPublic !== undefined) updates.public = isPublic;
        if (rules !== undefined) updates.rules = rules;

        // Verify newName uniqueness if it is being changed
        if (newName) {
            const newNameLower = newName.toLowerCase();
            const oldNameLower = cleanName.toLowerCase();

            // If the new name (case insensitive) is different, check for uniqueness
            if (newNameLower !== oldNameLower) {
                const nameCheckSnap = await commsRef.where("nameLower", "==", newNameLower).get();

                if (!nameCheckSnap.empty) {
                    console.log(`Community name "${newName}" is already taken.`);
                    return res.status(409).send({
                        status: "Conflict",
                        message: `Community name "${newName}" is already taken.`,
                    });
                }
                // Set lowercase name update
                updates.nameLower = newNameLower;
            }
            // Set name updates
            updates.name = newName;
        }
        
        // Update community document
        await commRef.update(updates);
        console.log(`Community "${cleanName}" successfully updated.`);
        res.status(200).send({
            status: "ok",
            message: `Community "${cleanName}" successfully updated.`,
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
        const userId = await genUtil.getUserIdFromSessionCookie(req);
        // Verify ownership or mod privileges
        const { data: commData } = await commUtil.getCommunityByName(commName);
        await genUtil.verifyUserIsOwnerOrMod(commData, userId);

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

        // Get community document and data
        const { ref: communityDoc, data: communityData } = await commUtil.getCommunityByName(communityName);
        const groupsRefs = communityData.groupsInCommunity || [];

        // Fetch user data for community lists
        const ownerList = await commUtil.fetchUserData(communityData.ownerList || []);
        const modList = await commUtil.fetchUserData(communityData.modList || []);
        const userList = await commUtil.fetchUserData(communityData.userList || []);
        const blacklist = await commUtil.fetchUserData(communityData.blacklist || []);

        // Fetch all groups
        const groupsInCommunity: commUtil.Group[] = [];
        for (const groupRef of groupsRefs) {
            const groupSnap = await groupRef.get();
            if (!groupSnap.exists) continue;

            const groupData = groupSnap.data();
            const forumsRefs = groupData.forumsInGroup || [];

            // Fetch all forums for the current group
            const forumsInGroup: commUtil.Forum[] = [];
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
                rules: communityData.rules,
                public: communityData.public,
                ownerList,
                modList,
                userList,
                blacklist,
                groupsInCommunity,
                icon: communityData.icon,
                banner: communityData.banner,
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

// Get top 10 communities based on yayScore
const getTopCommunities = async (req: Request, res: Response) => {
    try {
        const snap = await db
            .collection("Communities")
            .orderBy("yayScore", "desc")
            .limit(10)
            .get();

        const communities = snap.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                name: data.name || "",
                icon: data.icon || "",
                numUsers: data.numUsers || 0,
                yayScore: data.yayScore || 0,
            };
        });

        res.status(200).send({
            status: "ok",
            communities,
        });
    } catch (err) {
        console.error("Error fetching top communities:", err);
        res.status(500).send({
            status: "error",
            message: "Failed to fetch top communities",
        });
    }
};


export {
    getAllDocuments,
    prefixSearch,
    addDoc,
    getDocByName,
    kickUser,
    banUser,
    unbanUser,
    getBlacklist,
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
    editGroup,
    reportPost,
    getTopCommunities,
}
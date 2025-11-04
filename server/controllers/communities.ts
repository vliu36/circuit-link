import { DocumentReference, Timestamp, Firestore, FieldValue } from "firebase-admin/firestore";
import { db } from "../firebase.ts";
import { Request, Response } from "express";
import admin from "firebase-admin";
import { group } from "console";

interface Forum {
    id: string,
    name: string,
    slug: string,
    description?: string,
}

interface Group {
    id: string,
    name: string,
    forumsInGroup: Forum[],
}

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
        const { name, description, userId, publicity }: { name: string; description: string; userId: string; publicity: boolean } = req.body;
        const communitiesRef = await db.collection("Communities");
        const snapshot = await communitiesRef.where("name", "==", req.body.name).get();

        if (!snapshot.empty) {
            res.send(400).send({
                status: "Bad Request",
                message: "Community already exists!"
            })
        }

        const userRef = db.doc(`/Users/${userId}`);
        const nameLower = name.toLowerCase();

        const data = {
            blacklist: [],                                                              
            dateCreated: Timestamp.fromDate(new Date()),
            description,                                                                
            groupsInCommunity: [],                                                      
            forumsInCommunity: [],      // This is field is for easier querying
            userList: [userRef],                                                        
            modList: [userRef],                                                         
            ownerList: [userRef],                                                       
            name,
            nameLower,
            numUsers: 1,                                                                
            public: publicity,
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

        res.status(201).send({
            status: "OK",
            message: "Successfully added to Communities, " + commRef.id,
            docId: commRef.id
        });
    } catch (err) {
        res.status(500).send({
            status: "Backend error: Could not add document to Communities",
            message: err
        });
    } // end try catch
} // end addDoc

const createGroup = async (req: Request, res: Response) => {
    try {
        const { commName, name, userId } = req.body;

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

// -------- Helper functions for deleteGroup -------- //
// --- Helper function for deleteGroup to recursively delete replies of a post or another reply --- //
async function deleteRepliesRecursively(replyRef: DocumentReference) {
    const repliesSnap = await db.collection("Replies")
        .where("parentReply", "==", replyRef)
        .get();

    for (const replyDoc of repliesSnap.docs) {
        await deleteRepliesRecursively(replyDoc.ref); // recursive deletion
        await replyDoc.ref.delete();
    }

    await replyRef.delete(); // finally delete the reply itself
}

// --- Helper function for deleteGroup to recursively delete posts and replies in a forum --- //
async function deletePostsInForum(forumRef: DocumentReference) {
    const postsSnap = await db.collection("Posts")
        .where("parentForum", "==", forumRef)
        .get();

    for (const postDoc of postsSnap.docs) {
        const postRef = postDoc.ref;

        // Delete replies belonging to this post
        const repliesSnap = await db.collection("Replies")
            .where("parentPost", "==", postRef)
            .get();

        for (const replyDoc of repliesSnap.docs) {
            await deleteRepliesRecursively(replyDoc.ref);
        }

        await postRef.delete(); // delete the post itself
    }
}

// --- Helper function for deleteGroup to recursively delete forums, posts, and replies in a group --- //
async function deleteForumsInGroup(groupRef: DocumentReference) {
    const forumsSnap = await db.collection("Forums")
        .where("parentGroup", "==", groupRef)
        .get();

    for (const forumDoc of forumsSnap.docs) {
        const forumRef = forumDoc.ref;

        // Dereference the forum from its parent community
        const forumData = forumDoc.data();
        const parentCommunityRef: DocumentReference | undefined = forumData?.parentCommunity;
        if (parentCommunityRef) {
            await parentCommunityRef.update({
                forumsInCommunity: FieldValue.arrayRemove(forumRef)
            });
        }

        // Delete all posts in this forum
        await deletePostsInForum(forumRef);

        // Finally, delete the forum itself
        await forumRef.delete();
    }
}

// Deletes a group, all its forums, posts, and replies
const deleteGroup = async (req: Request, res: Response) => {
    try {
        const { groupId } = req.params;

        const groupRef = db.collection("Groups").doc(groupId);
        const groupSnap = await groupRef.get();

        if (!groupSnap.exists) {
            return res.status(404).json({
                status: "Not Found",
                message: "Group not found",
            });
        }

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



// TODO: ---------------- Add function that adds a user into a community as a user, mod, or owner ---------------- // 

const deleteDoc = async (req: Request, res: Response) => {
    try {
        const { name, userId } = req.body;

        if (!name || !userId) {
            return res.status(400).send({
                status: "Bad Request",
                message: "Missing community name or user ID in request body.",
            });
        }

        // Convert the name to lowercase
        const nameLower = name.toLowerCase();

        // Find community by name
        const commRef = db.collection("Communities");
        const snapshot = await commRef.where("nameLower", "==", nameLower).get();
        if (snapshot.empty) {
            return res.status(404).send({
                status: "Not Found",
                message: `No community found with name ${name}`,
            });
        }

        const doc = snapshot.docs[0];
        const commData = doc.data();

        // Check if requester is an owener
        const userRef = db.doc(`/Users/${userId}`)
        const ownerList: FirebaseFirestore.DocumentReference[] = commData.ownerList || [];
        let isOwner = ownerList.some(ref => ref.path === userRef.path);

        if (!isOwner) {
            return res.status(403).send({
                status: "Forbidden",
                message: "You are not authorized to delete this community.",
            });
        }

        // Delete the community document
        await doc.ref.delete();

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

        // Helper function to fetch user data from references
        const fetchUserData = async (userRefs: DocumentReference[]) => {
            const users = [];
            for (const userRef of userRefs) {
                const userSnap = await userRef.get();
                if (userSnap.exists) {
                    users.push({ id: userSnap.id, ...userSnap.data() });
                }
            }
            return users;
        };

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
                forumsInGroup.push({ id: forumSnap.id, ...forumSnap.data() }); // TODO: Attempt to omit sending posts
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
}
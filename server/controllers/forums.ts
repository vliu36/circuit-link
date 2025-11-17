import { db, auth } from "../firebase.ts"
import { Request, Response } from "express"
import { Timestamp } from "firebase-admin/firestore";
import admin from "firebase-admin";
import { DocumentReference } from "firebase-admin/firestore";
import * as forumUtils from "./_utils/forumUtils.ts";
import { cookieParser, getUserIdFromSessionCookie } from "./_utils/generalUtils.ts";

// Retrieves all documents in Forums
const getAllDocuments = async (req: Request, res: Response) => {
    try {
        const forumsRef = db.collection("Forums");
        const snapshot = await forumsRef.get();
        
        res.status(200).send({
            status: "OK",
            message: snapshot.docs.map(doc => doc.data())
        })
    }
    catch (err) {
        console.log(err);
        res.status(500).send({
            status: "backend error",
            message: err
        })
    }    
}


// Creates and adds a document in Forums
const addDoc = async (req: Request, res: Response) => {
    try {
        const { name, description, groupId, commName } = req.body;
        // Verify and get userId from session cookie
        const userId = await getUserIdFromSessionCookie(req);

        const commsRef = db.collection("Communities");

        // Generate slug from name
        const slug = name
            .toLowerCase()
            .trim()
            .replace(/\s+/g, "-")
            .replace(/[^\w-]/g, "")
            .replace(/--+/g, "-");

        const commSnap = await commsRef.where("name", "==", commName).get();
        if (commSnap.empty) {
            console.log("Community not found:", commName);
            return res.status(404).send({
                status: "Not Found",
                message: "Community not found",
            });
        }
        const commDoc = commSnap.docs[0];
        const commRef = commDoc.ref;
        const groupRef = db.doc(`/Groups/${groupId}`);
        const userRef = db.doc(`/Users/${userId}`);

        // Verify user is an owner or mod of the community
        const commData = commDoc.data();
        const ownerList: FirebaseFirestore.DocumentReference[] = commData.ownerList || [];
        const modList: FirebaseFirestore.DocumentReference[] = commData.modList || [];
        let isOwner = ownerList.some(ref => ref.path === userRef.path);
        let isMod = modList.some(ref=> ref.path === userRef.path);

        if (!isOwner && !isMod) {
            return res.status(403).send({
                status: "Forbidden",
                message: "User is not authorized to create a forum in this community.",
            });
        }

        // Check for duplicate forums
        const isDuplicate = await forumUtils.checkDuplicateForum(name, slug, commRef);
        if (isDuplicate) {
            return res.status(400).send({
                status: "Bad Request",
                message: "Forum already exists!",
            });
        }

        // Create forum
        const data = {
            dateCreated: Timestamp.fromDate(new Date()),
            description,
            name,
            slug,
            postsInForum: [],
            // repliesInForum: [],
            ownerList: [userRef],
            parentGroup: groupRef,
            parentCommunity: commRef,
        };
        const forumRef = await db.collection("Forums").add(data);

        // Update references in parent community and group
        await Promise.all([
            commRef.update({
                forumsInCommunity: admin.firestore.FieldValue.arrayUnion(forumRef),
            }),
            groupRef.update({
                forumsInGroup: admin.firestore.FieldValue.arrayUnion(forumRef),
            }),
        ]);

        res.status(201).send({
            status: "OK",
            message: `Successfully created Forum ${forumRef.id}`,
            docId: forumRef.id,
        });
    } catch (err) {
        console.error("Error creating forum:", err);
        res.status(500).send({
            status: "Backend error: Could not add document to Communities",
            message: err instanceof Error ? err.message : err,
        });
    } // end try catch
}; // end addDoc

// Retrieves a specific forum and all its posts by its slug within a specified community
const getForumBySlug = async (req: Request, res: Response) => {
    try {
        const { commName, forumSlug } = req.params;
        const { sortMode } = req.body; 

        // Locate community 
        const community = await forumUtils.getCommunityByName(commName);
        if (!community) {
            return res.status(404).json({
                status: "Not Found",
                message: `Community "${commName}" not found.`,
            });
        }

        const { commDoc, commData } = community;

        // Find forum in that community 
        const forumRef = await forumUtils.findForumRefInCommunity(commData, forumSlug);
        if (!forumRef) {
            return res.status(404).json({
                status: "Not Found",
                message: `Forum with slug "${forumSlug}" not found in community "${commName}".`,
            });
        }

        // Retrieve forum data 
        const forumSnap = await forumRef.get();
        const forumData = forumSnap.data();
        if (!forumData) {
            return res.status(404).json({
                status: "Not Found",
                message: "Forum data could not be retrieved.",
            });
        }

        // Retrieve and format posts 
        const postRefs: DocumentReference[] = forumData.postsInForum || [];
        const sortedPosts = await forumUtils.getFormattedPosts(postRefs, sortMode || "newest");

        // Return combined data 
        res.status(200).json({
            status: "OK",
            forum: {
                id: forumSnap.id,
                ...forumData,
            },
            posts: sortedPosts,
        });
    } catch (err) {
        console.error("Error fetching forum:", err);
        res.status(500).json({
            status: "Backend error",
            message: err instanceof Error ? err.message : err,
        });
    }
};

// Deletes a forum, all its posts, and all replies listed in repliesInForum
const deleteForum = async (req: Request, res: Response) => {
    try {
        const { forumId } = req.params;
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

        // Verify forum exists
        const forumRef = db.collection("Forums").doc(forumId);
        const forumSnap = await forumRef.get();
        if (!forumSnap.exists) {
            return res.status(404).json({
                status: "Not Found",
                message: "Forum not found",
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
            console.log(`User with ID ${userId} is unauthorized to delete this forum.`);
            return res.status(403).send({
                status: "Forbidden",
                message: "You are not authorized to delete this forum.",
            });
        }
        console.log(`Confirmed user with ID ${userId} is ${isOwner ? "an owner" : "a moderator"} of community "${commName}".`);

        const forumData = forumSnap.data();

        // --- Delete all posts in the forum's postsInForum ---
        const postsSnapshot = await db
            .collection("Posts")
            .where("parentForum", "==", forumRef)
            .get();

        console.log("Deleting posts and their replies...");
        for (const postDoc of postsSnapshot.docs) {
            const postRef = postDoc.ref;
            await forumUtils.deleteRepliesRecursively(postRef);
            // Delete the post itself
            await postRef.delete();
            // Update community's yayScore by decrementing the post's yayScore
            const postData = postDoc.data();
            const commRef: FirebaseFirestore.DocumentReference = postData?.parentCommunity;
            await commRef.update({
                yayScore: admin.firestore.FieldValue.increment(-postData?.yayScore || 0),
            });
        }
        console.log("All posts and their replies deleted.");

        // Dereference the forum from its parents parentGroup and parentCommunity
        console.log("Dereferencing forum from parent group and community...");
        await forumUtils.dereferenceForumFromParents(forumRef, forumData);
        console.log("Dereferencing complete.");

        // --- Delete the forum itself ---
        console.log("Deleting forum...");
        await forumRef.delete();
        console.log("Forum deleted.");

        res.status(200).json({
            status: "ok",
            message: `Forum ${forumId} and all its posts & replies deleted successfully`,
        });

    } catch (err) {
        console.error("Error deleting forum:", err);
        res.status(500).json({
            status: "Backend error",
            message: err instanceof Error ? err.message : err,
        });
    }
};

// Edit forum details
const editForum = async (req: Request, res: Response) => {
    try {
        const { forumId } = req.params;
        const { name, description } = req.body;
        // Verify and get userId from session cookie
        const userId = await getUserIdFromSessionCookie(req);
        if (!userId) {
            console.log("No user provided.");
            return res.status(400).send({
                status: "Bad Request",
                message: "Missing user ID in request.",
                newSlug: "",
            });
        }
        // Verify forum exists
        const forumRef = db.collection("Forums").doc(forumId);
        const forumSnap = await forumRef.get();
        if (!forumSnap.exists) {
            console.log("Forum not found:", forumId);
            return res.status(404).json({
                status: "Not Found",
                message: "Forum not found",
                newSlug: "",
            });
        }

        // Check if requester is an owner or mod of the parent community
        const forumData = forumSnap.data();
        const parentCommunityRef: DocumentReference = forumData?.parentCommunity;
        if (!parentCommunityRef) {
            throw new Error("Parent community reference missing from forum data.");
        }
        const parentCommunitySnap = await parentCommunityRef.get();
        const parentCommunityData = parentCommunitySnap.data();
        if (!parentCommunityData) {
            throw new Error("Parent community data could not be retrieved.");
        }
        const ownerList: FirebaseFirestore.DocumentReference[] = parentCommunityData.ownerList || [];
        const modList: FirebaseFirestore.DocumentReference[] = parentCommunityData.modList || [];

        const userRef = await db.doc(`/Users/${userId}`);

        const isOwner = ownerList.some((ref: DocumentReference) => ref.id === userRef.id);
        const isMod = modList.some((ref: DocumentReference) => ref.id === userRef.id);
        if (!isOwner && !isMod) {
            console.log("User is not an owner or moderator of the parent community:", userId);
            return res.status(403).json({
                status: "Forbidden",
                message: "User is not an owner or moderator of the parent community.",
                newSlug: "",
            });
        }

        // If data sent does not change anything, return message
        if (
            (!name || name === forumData?.name) &&
            (!description || description === forumData?.description)
        ) {
            console.log("No changes detected in the update request.");
            return res.status(200).send({
                status: "ok",
                message: "No changes detected in the update request.",
            });
        }

        // Verify forum name uniqueness within the community if name is being changed
        if (name && name !== forumData?.name) {
            const slug = name
                .toLowerCase()
                .trim()
                .replace(/\s+/g, "-")
                .replace(/[^\w-]/g, "")
                .replace(/--+/g, "-");
            const isDuplicate = await forumUtils.checkDuplicateForum(name, slug, parentCommunityRef);
            if (isDuplicate) {
                console.log("Duplicate forum name within the community:", name);
                return res.status(400).json({
                    status: "Bad Request",
                    message: "Forum name already exists within the community.",
                    newSlug: "",
                });
            }
        }

        // Update forum details
        const updates: Partial<{ name: string; slug: string, description: string }> = {};
        if (name) {
            updates.name = name;
            updates.slug = name
                .toLowerCase()
                .trim()
                .replace(/\s+/g, "-")
                .replace(/[^\w-]/g, "")
                .replace(/--+/g, "-");
        }
        if (description) updates.description = description;
        await forumRef.update(updates);

        console.log("Forum updated successfully:", forumId);
        res.status(200).json({
            status: "ok",
            message: `Forum ${name} updated successfully`,
            newSlug: updates.slug,
        });
    } catch (err) {
        console.error("Error editing forum:", err);
        res.status(500).json({
            status: "Backend error",
            message: err instanceof Error ? err.message : err,
            newSlug: "",
        });
    }
};

// Runs prefix search on post titles 
const searchForum = async (req: Request, res: Response) => {
    
}

export {
    getAllDocuments,
    addDoc,
    getForumBySlug,
    deleteForum,
    editForum,
}
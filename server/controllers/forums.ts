import { db, auth } from "../firebase.ts"
import { Request, Response } from "express"
import { Timestamp } from "firebase-admin/firestore";
import admin from "firebase-admin";
import { DocumentReference } from "firebase-admin/firestore";
import * as forumUtils from "./_utils/forumUtils.ts";
import { cookieParser } from "./_utils/generalUtils.ts";

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
        const { name, description, userId, groupId, commName } = req.body;

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
        const sortedPosts = await forumUtils.getFormattedPosts(postRefs);

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

        // Verify and get userId from session cookie
        const cookies = cookieParser(req);
        const sessionCookie = cookies.session;
        const decodedClaims = await auth.verifySessionCookie(sessionCookie, true);
        const userId = decodedClaims.uid; // Authenticated user's UID

        if (!userId) {
            console.log("No community or user provided.");
            return res.status(400).send({
                status: "Bad Request",
                message: "Missing user ID in request.",
            });
        }

        const forumRef = db.collection("Forums").doc(forumId);
        const forumSnap = await forumRef.get();
        if (!forumSnap.exists) {
            return res.status(404).json({
                status: "Not Found",
                message: "Forum not found",
            });
        }

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
            await postRef.delete();
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


export {
    getAllDocuments,
    addDoc,
    getForumBySlug,
    deleteForum,
}
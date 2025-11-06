import { group } from "console";
import { db } from "../firebase.ts"
import { Request, Response } from "express"
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import admin from "firebase-admin";
import { DocumentReference } from "firebase-admin/firestore";

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

// -------- Helper functions for addDoc -------- //
// --- Helper for checking duplicate forum names/slugs in a community --- //
const checkDuplicateForum = async (name: string, slug: string, commRef: DocumentReference) => {
    const forumsSnap = await db.collection("Forums")
        .where("parentCommunity", "==", commRef)
        .get();

    for (const forumDoc of forumsSnap.docs) {
        const forumData = forumDoc.data();
        if (forumData.name === name || forumData.slug === slug) {
            return true;
        }
    }
    return false;
};

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
        const isDuplicate = await checkDuplicateForum(name, slug, commRef);
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

// -------- Helper functions for getForumBySlug -------- //
// --- Helper: Get community document by name ---
async function getCommunityByName(commName: string) {
    const commSnap = await db
        .collection("Communities")
        .where("name", "==", commName)
        .limit(1)
        .get();

    if (commSnap.empty) return null;
    const commDoc = commSnap.docs[0];
    return { commDoc, commData: commDoc.data() };
}

// --- Helper: Find a forum reference within a community by slug ---
async function findForumRefInCommunity(commData: any, forumSlug: string): Promise<DocumentReference | null> {
    const forumsInCommunity: DocumentReference[] = commData.forumsInCommunity || [];

    for (const ref of forumsInCommunity) {
        if (!ref || typeof ref.get !== "function") continue;
        const forumSnap = await ref.get();
        const forumData = forumSnap.data();
        if (forumData?.slug === forumSlug) return ref;
    }

    return null;
}

// --- Helper: Retrieve and enrich post data ---
async function getFormattedPosts(postRefs: DocumentReference[]) {
    const posts = await Promise.all(
        postRefs.map(async (postRef) => {
            const postSnap = await postRef.get();
            if (!postSnap.exists) return null;

            const data = postSnap.data();

            // Author dereferencing 
            let authorUsername = "Unknown";
            let authorId = "Unknown";
            if (data?.author?.get) {
                const authorSnap = await data.author.get();
                if (authorSnap.exists) {
                    authorUsername = authorSnap.data()?.username || "Unknown";
                    authorId = authorSnap.id;
                }
            }

            // Convert yayList/nayList to arrays of user IDs
            const yayList = (data?.yayList || []).map((ref: DocumentReference | string) =>
                typeof ref === "string" ? ref : ref.path.split("/").pop()
            );
            const nayList = (data?.nayList || []).map((ref: DocumentReference | string) =>
                typeof ref === "string" ? ref : ref.path.split("/").pop()
            );

            return {
                id: postSnap.id,
                ...data,
                authorUsername,
                authorId,
                yayList,
                nayList,
                timePosted: data?.timePosted?.toMillis() || null,
            };
        })
    );

    // Remove nulls and sort
    return posts
        .filter(Boolean)
        .sort((a: any, b: any) => (b.timePosted || 0) - (a.timePosted || 0));
}

// Retrieves a specific forum and all its posts by its slug within a specified community
const getForumBySlug = async (req: Request, res: Response) => {
    try {
        const { commName, forumSlug } = req.params;

        // Locate community 
        const community = await getCommunityByName(commName);
        if (!community) {
            return res.status(404).json({
                status: "Not Found",
                message: `Community "${commName}" not found.`,
            });
        }

        const { commDoc, commData } = community;

        // Find forum in that community 
        const forumRef = await findForumRefInCommunity(commData, forumSlug);
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
        const sortedPosts = await getFormattedPosts(postRefs);

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

// -------- Helper functions for deleteForum -------- //
// --- Helper to delete replies recursively --- //
async function deleteRepliesRecursively(parentRef: DocumentReference): Promise<void> {
    const repliesSnapshot = await db
        .collection("Replies")
        .where("parentPost", "==", parentRef)
        .get();

    // For each reply: delete its children first
    for (const replyDoc of repliesSnapshot.docs) {
        const replyRef = replyDoc.ref;
        await deleteRepliesRecursively(replyRef); // recursive step for nested replies
        await replyRef.delete();
    }
}
// --- Helper to dereference forum from parent group and community ---
async function dereferenceForumFromParents(forumRef: DocumentReference, forumData: any): Promise<void> {
    const parentGroupRef: DocumentReference | undefined = forumData?.parentGroup;
    const parentCommunityRef: DocumentReference | undefined = forumData?.parentCommunity;
    if (parentGroupRef) {
        await parentGroupRef.update({
            forumsInGroup: FieldValue.arrayRemove(forumRef),
        });
    }
    if (parentCommunityRef) {
        await parentCommunityRef.update({
            forumsInCommunity: FieldValue.arrayRemove(forumRef),
        });
    }
}

// Deletes a forum, all its posts, and all replies listed in repliesInForum
const deleteForum = async (req: Request, res: Response) => {
    try {
        const { forumId } = req.params;
        // TODO : Add authentication/authorization checks whether user is owner of forum, community or a mod

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
            await deleteRepliesRecursively(postRef);
            await postRef.delete();
        }
        console.log("All posts and their replies deleted.");

        // Dereference the forum from its parents parentGroup and parentCommunity
        console.log("Dereferencing forum from parent group and community...");
        await dereferenceForumFromParents(forumRef, forumData);
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
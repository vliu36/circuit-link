import { db } from "../firebase.ts"
import { Request, Response } from "express"
import { FieldValue, DocumentReference, Timestamp } from "firebase-admin/firestore";
import { fetchRepliesRecursively, Post, deleteNestedRepliesRecursive, getPostForumAndGroup } from "./_utils/postUtils.ts";
import { getUserIdFromSessionCookie } from "./_utils/generalUtils.ts";
import { getCommunityByName } from "./_utils/commUtils.ts";
import { isUserAuthorizedToDeleteDoc } from "./_utils/generalUtils.ts";

// -------------------------------- Controller functions -------------------------------- //
// Retrieves all documents in Posts sorted by date posted (modified to get post authors from Users)
const getAllDocuments = async (req: Request, res: Response) => {
    try {
        const snapshot = await db.collection("Posts").orderBy("timePosted", "desc").get();

        const posts = await Promise.all(
            snapshot.docs.map(async (doc) => {
                const data = doc.data();

                // Check if author exists and is a DocumentReference
                let username = "Unknown";
                let authorId = "Unknown";
                let authorPFP = "Unknown";
                if (data.author?.get) {
                    const userDoc = await data.author.get(); // dereference the DocumentReference
                    username = userDoc.exists ? userDoc.data()?.username || "Unknown" : "Unknown";
                    authorId = data.author.path.split("/").pop(); // extract author uid
                    authorPFP = userDoc.exists ? userDoc.data()?.photoURL || "Unknown" : "Unknown";
                }

                // Convert and return yayList and nayList as arrays of strings of uids
                const yayList: string[] = (data.yayList || []).map((ref: DocumentReference) => 
                    typeof ref === "string" ? ref : ref.path.split("/").pop()
                );
                const nayList: string[] = (data.nayList || []).map((ref: DocumentReference) =>
                    typeof ref === "string" ? ref : ref.path.split("/").pop()
                );

                return {
                    id: doc.id,
                    ...data,
                    authorUsername: username,
                    authorId: authorId,
                    authorPFP: authorPFP,
                    yayList,
                    nayList,
                    timePosted: data.timePosted?.toMillis() || null,
                };
            })
        );

        res.status(200).send({ message: posts });
    } catch (err) {
        console.error(err);
        res.status(500).send({
            status: "backend error",
            message: err,
        });
    }
};

// Creates and adds a document in Posts
const addDoc = async (req: Request, res: Response) => {         // TODO: Split this function into smaller helper functions
    try {
        const {
            // author,     // User ID of post author // ! DEPRECATED - now derived from session cookie
            title,
            contents,
            commName,   // Community name
            forumSlug,  // Forum slug
            media       // Optional media URL
        } = req.body;

        const authorId = await getUserIdFromSessionCookie(req);

        const authorRef = db.doc(`/Users/${authorId}`);
        const postsRef = db.collection("Posts");

        // Validate required fields
        if (!authorId || !title || !contents || !commName || !forumSlug) {
            return res.status(400).send({
                status: "Bad Request",
                message: "Missing required fields: author, title, contents, commName, or forumSlug",
            });
        }

        // Get the Community document
        const { ref: commRef, data: commData } = await getCommunityByName(commName);

        // Find parent forum by slug, and get its parent group
        const { forumRef, parentGroupRef } = await getPostForumAndGroup(commData, forumSlug);

        // Create post data
        const now = Timestamp.fromDate(new Date());
        
        const postData = {
            title,
            contents,
            author: authorRef,
            yayScore: 1,
            replyCount: 0,
            yayList: [authorRef],
            nayList: [],
            listOfReplies: [],
            timePosted: now,
            timeUpdated: now,
            edited: false,
            parentCommunity: commRef,
            parentGroup: parentGroupRef,
            parentForum: forumRef,
            media: media || null,
            keywords: [...new Set(["",...req.body.contents.split(" "),...req.body.title.split(" ")])] // Stores words into an array for post searching
        };

        // Add to Posts collection
        const newPostRef = await postsRef.add(postData);

        // Update related collections
        await Promise.all([
            forumRef?.update({
                postsInForum: FieldValue.arrayUnion(newPostRef),
            }),
        ]);

        // Update community's yayScore
        await commRef.update({
            yayScore: FieldValue.increment(1),
        });
        // Update author's yayScore
        await authorRef.update({
            yayScore: FieldValue.increment(1),
        });

        return res.status(201).send({
            status: "OK",
            message: `Successfully added post ${newPostRef.id}`,
            docId: newPostRef.id,
        });
    } catch (err) {
        console.error("Error creating post:", err);
        res.status(500).send({
            status: "Backend error: Could not add document to Posts",
            message: err instanceof Error ? err.message : err,
        });
    }
};

// Edit post (only author can edit)
const editDoc = async (req: Request, res: Response) => {
    try {
        const postId = req.params.id;
        const userId = await getUserIdFromSessionCookie(req);
        
        const postRef = db.collection("Posts").doc(postId);
        const postDoc = await postRef.get();
        if (!postDoc.exists) {
            return res.status(404).send({
                status: "Not Found",
                message: "Post not found",
            });
        }
        const postData = postDoc.data();

        // Get author ID from DocumentReference
        const authorPath = postData?.author?.path; // e.g. "Users/<uid>"
        const authorId = authorPath?.split("/")[1];
        // Check if the requesting user is the author
        if (authorId !== userId) {
            return res.status(403).send({
                status: "Forbidden",
                message: "You are not authorized to edit this post.",
            });
        }

        // Check if changes provided are the same as existing data
        if (
            (req.body.title && req.body.title === postData?.title) &&
            (req.body.contents && req.body.contents === postData?.contents)
        ) {
            return res.status(200).send({
                status: "OK",
                message: "No changes were made.",
            });
        }

        // Prepare updates
        const updates: Partial<Post> = {};
        if (req.body.title) updates.title = req.body.title;
        if (req.body.contents) updates.contents = req.body.contents;
        if (req.body.contents || req.body.title) {
            updates.keywords = [...new Set(["",...req.body.contents.split(" "),...req.body.title.split(" ")])];
        }
        updates.timeUpdated = Timestamp.fromDate(new Date());
        updates.edited = true; // Mark post as edited
        // Apply updates
        await postRef.update(updates);

        res.status(200).send({
            status: "OK",
            message: `Post ${postId} successfully updated.`,
        });
    } catch (err) {
        console.error(err);
        res.status(500).send({
            status: "Backend error: Could not update post",
            message: err,
        });
    }
}


// Delete post (Can only be done by author or community mods)
const deleteDoc = async (req: Request, res: Response) => {
    try {
        const postId = req.params.id;   // id of the post being deleted
        const userId = await getUserIdFromSessionCookie(req);
        const commName = req.body.commName; // the community this post belongs to

        const postRef = db.collection("Posts").doc(postId);
        const postDoc = await postRef.get();

        if (!postDoc.exists) {
            return res.status(404).send({ status: "Not Found", message: "Post not found" });
        }

        const postData = postDoc.data();

        // Check if the requests comes from the author or a mod/owner of the community
        const authorized = await isUserAuthorizedToDeleteDoc(userId, postData!, commName);
        if (!authorized) {
            return res.status(403).send({
                status: "Forbidden",
                message: "You are not authorized to delete this post.",
            });
        }

        // Delete all replies recursively
        console.log("Deleting replies...");
        const replyRefs: FirebaseFirestore.DocumentReference[] = postData?.listOfReplies || [];
        await deleteNestedRepliesRecursive(replyRefs);
        console.log("All replies deleted.");

        // Dereference post from parent forum
        console.log("Dereferencing post from parent forum...");
        const parentForumRef: DocumentReference = postData?.parentForum;
        if (parentForumRef) {
            await parentForumRef.update({
                postsInForum: FieldValue.arrayRemove(postRef),
            });
        }
        console.log("Dereferencing complete.");

        // Update community's yayScore
        const parentCommunityRef: FirebaseFirestore.DocumentReference = postData?.parentCommunity;
        await parentCommunityRef.update({
            yayScore: FieldValue.increment(-postData?.yayScore || 0),
        });
        // Update author's yayScore
        const authorRef: FirebaseFirestore.DocumentReference = postData?.author;
        await authorRef.update({
            yayScore: FieldValue.increment(-postData?.yayScore || 0),
        });

        // Delete the document from Firestore
        console.log("Deleting post...");
        await postRef.delete();
        console.log("Post deleted.");

        return res.status(200).send({
            status: "ok",
            message: `Post ${postId} deleted successfully.`,
        });
    } catch (err) {
        console.error(err);
        res.status(500).send({
            status: "Backend error: Could not delete post",
            message: err,
        });
    } // end try catch
} // end deletePost

// Yays and Nays
const votePost = async (req: Request, res: Response) => {
    try {
        const { id, type } = req.body; // type: "yay" | "nay"
        if (!["yay", "nay"].includes(type)) {
            return res.status(400).send({
                status: "error", 
                message: "Invalid vote type" 
            });
        }
        const userId = await getUserIdFromSessionCookie(req);

        const postRef = db.collection("Posts").doc(id);

        await db.runTransaction(async (transaction) => {
            const postSnap = await transaction.get(postRef);
            if (!postSnap.exists) throw new Error("Post not found");

            const postData = postSnap.data()!;
            const userRef = db.doc(`/Users/${userId}`);
            const commRef: FirebaseFirestore.DocumentReference = postData.parentCommunity;

            // Extract current lists
            const yayList: FirebaseFirestore.DocumentReference[] = postData.yayList || [];
            const nayList: FirebaseFirestore.DocumentReference[] = postData.nayList || [];

            const liked = yayList.some(ref => ref.path === userRef.path);
            const disliked = nayList.some(ref => ref.path === userRef.path);

            let updatedYayList = yayList;
            let updatedNayList = nayList;
            let yayScore = postData.yayScore || 0;

            // Keep old score for computing difference
            const oldYayScore = yayScore;

            // Voting logic
            if (type === "yay") {
                if (liked) {
                    // Toggle off like
                    updatedYayList = yayList.filter(ref => ref.path !== userRef.path);
                    yayScore -= 1;
                } else {
                    // Remove dislike if exists
                    if (disliked) {
                        updatedNayList = nayList.filter(ref => ref.path !== userRef.path);
                        yayScore += 1; // remove -1 from dislike
                    }
                    updatedYayList = [...updatedYayList, userRef];
                    yayScore += 1;
                } // end if else
            } else if (type === "nay") {
                if (disliked) {
                    // Toggle off dislike
                    updatedNayList = nayList.filter(ref => ref.path !== userRef.path);
                    yayScore += 1; // remove -1 from dislike
                } else {
                    // Remove like if exists
                    if (liked) {
                        updatedYayList = yayList.filter(ref => ref.path !== userRef.path);
                        yayScore -= 1; // remove +1 from like
                    }
                    updatedNayList = [...updatedNayList, userRef];
                    yayScore -= 1;
                } // end if else
            } // end if else-if

            // Update post document
            transaction.update(postRef, {
                yayList: updatedYayList,
                nayList: updatedNayList,
                yayScore,
            });

            // Update community's and author's yayScore based on difference
            const authorRef: FirebaseFirestore.DocumentReference = postData.author;
            const diff = yayScore - oldYayScore;
            if (diff !== 0) {
                transaction.update(commRef, {
                    yayScore: FieldValue.increment(diff),
                });
                transaction.update(authorRef, {
                    yayScore: FieldValue.increment(diff),
                });
            }
        }); // end transaction

        res.status(200).send({ status: "OK", message: "Vote updated" });
    } catch (err) {
        console.error(err);
        res.status(500).send({ status: "error", message: err });
    } // end try catch
} // end function votePost

// Adds a reply to an existing post
const replyToPost = async (req: Request, res: Response) => {
    try {
        const { id } = req.params; // id of the post being replied to
        const { replyId } = req.body;

        const replyRef = await db.collection("Replies").doc(replyId);

        if (!replyRef) {
            res.send(400).send({
                status: "Bad Request",
                message: "Reply document reference does not exist in Replies"
            });
        }

        // Update the post's listOfReplies and increment replyCount
        const post = await db.collection("Posts").doc(id);
        const result = await post.update({
            listOfReplies: FieldValue.arrayUnion(db.doc(`/Replies/${replyId}`)),
            replyCount: FieldValue.increment(1),
        });

        // Update community's yayScore
        const postSnap = await post.get();
        const postData = postSnap.data();
        const commRef: FirebaseFirestore.DocumentReference = postData?.parentCommunity;
        await commRef.update({
            yayScore: FieldValue.increment(1),
        });

        res.status(200).send({
            status: "OK",
            message: result
        })
    }
    catch (err) {
        res.status(500).send({
            status: "Backend error",
            message: err
        })
    }
}



// Retrieve a post by its ID
const getPostById = async (req: Request, res: Response) => {
    try {
        const postId = req.params.id;
        const postRef = db.collection("Posts").doc(postId);
        const postSnap = await postRef.get();
        
        if (!postSnap.exists) {
            return res.status(404).send({
                status: "Not Found",
                message: "Post not found",
            });
        }

        const data = postSnap.data();

        // Dereference author
        let authorUsername = "Unknown";
        let authorId = "Unknown";
        let authorPFP = "Unknown";
        let parentForum: string | null = null;
        let parentGroup: string | null = null;
        if (data?.author?.get) {
            const authorSnap = await data.author.get();
            authorUsername = authorSnap.exists ? authorSnap.data()?.username || "Unknown" : "Unknown";
            authorId = data.author.path.split("/").pop() || "Unknown";
            authorPFP = authorSnap.exists ? authorSnap.data()?.photoURL || "Unknown" : "Unknown";
            parentForum = data.parentForum ? (data.parentForum as DocumentReference).id : null;
            parentGroup = data.parentGroup ? (data.parentGroup as DocumentReference).id : null;
        }

        // Convert yayList/nayList references to user IDs
        const yayList: string[] = (data?.yayList || []).map((ref: DocumentReference | string) =>
            typeof ref === "string" ? ref : ref.path.split("/").pop() || "Unknown"
        );
        const nayList: string[] = (data?.nayList || []).map((ref: DocumentReference | string) =>
            typeof ref === "string" ? ref : ref.path.split("/").pop() || "Unknown"
        );

        // Fetch all replies
        const listOfReplies = await fetchRepliesRecursively(data?.listOfReplies || []);

        const formattedPost = {
            id: postSnap.id,
            ...data,
            authorUsername,
            authorId,
            authorPFP,
            parentForum: parentForum,
            parentGroup: parentGroup,
            yayList,
            nayList,
            listOfReplies,
            timePosted: data?.timePosted?.toMillis() || null,
            timeUpdated: data?.timeUpdated?.toMillis() || null,
        };

        res.status(200).send({
            status: "OK",
            message: formattedPost,
        });
    } catch (err) {
        console.error(err);
        res.status(500).send({
            status: "Backend error",
            message: err,
        });
    }
} // end getPostById

export {
    getAllDocuments,
    addDoc,
    replyToPost,
    editDoc,
    deleteDoc,
    votePost,
    getPostById,
}
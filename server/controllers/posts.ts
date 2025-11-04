import { db } from "../firebase.ts"
import { Request, Response } from "express"
import { FieldValue, DocumentReference, Timestamp } from "firebase-admin/firestore";

interface Post {
    author: DocumentReference;
    title: string;
    contents: string;
    yayScore: number;
    replyCount: number;
    yayList: DocumentReference[];
    nayList: DocumentReference[];
    timePosted: Timestamp;
    timeUpdated: Timestamp;
    listOfReplies: DocumentReference[];
    edited: boolean;
}

interface Reply {
    id: string,
    authorUsername: string,
    authorId: string,
    yayList: string[],
    nayList: string[],
    timeReply: Timestamp;
    listOfReplies: Reply[];
    edited: boolean;
    contents: string;
}

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
                if (data.author?.get) {
                    const userDoc = await data.author.get(); // dereference the DocumentReference
                    username = userDoc.exists ? userDoc.data()?.username || "Unknown" : "Unknown";
                    authorId = data.author.path.split("/").pop(); // extract author uid
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
            author,     // User ID of post author
            title,
            contents,
            commName,   // Community name
            forumSlug,  // Forum slug
        } = req.body;

        const authorRef = db.doc(`/Users/${author}`);
        const postsRef = db.collection("Posts");

        // Validate required fields
        if (!author || !title || !contents || !commName || !forumSlug) {
            return res.status(400).send({
                status: "Bad Request",
                message: "Missing required fields: author, title, contents, commName, or forumSlug",
            });
        }

        // Get the Community document
        const commQuery = await db.collection("Communities")
            .where("name", "==", commName)
            .limit(1)
            .get();

        if (commQuery.empty) {
            return res.status(404).send({
                status: "Not Found",
                message: `Community "${commName}" not found.`,
            });
        }
        const commDoc = commQuery.docs[0];
        const commRef = commDoc.ref;
        const forumsInCommunity = commDoc.data().forumsInCommunity || [];

        // Find the Forum by slug
        let forumRef: DocumentReference | null = null;
        let parentGroupRef: DocumentReference | null = null;
        for (const fRef of forumsInCommunity) {
            const fSnap = await fRef.get();
            const fData = fSnap.data();
            if (fData?.slug === forumSlug) {
                forumRef = fRef;
                parentGroupRef = fData.parentGroup;
                break;
            }
        }

        if (!forumRef) {
            return res.status(404).send({
                status: "Not Found",
                message: `Forum with slug "${forumSlug}" not found in community "${commName}".`,
            });
        }
        if (!parentGroupRef) {
            return res.status(404).send({
                status: "Not Found",
                message: `Parent group for forum "${forumSlug}" not found.`,
            });
        }

        // Check for duplicate post by the same author
        const existingPostQuery = await postsRef
            .where("author", "==", authorRef)
            .where("title", "==", title)
            .where("contents", "==", contents)
            .get();
        if (!existingPostQuery.empty) {
            return res.status(400).send({
                status: "Bad Request",
                message: "A similar post from the same user already exists!",
            });
        }

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
        };

        // Add to Posts collection
        const newPostRef = await postsRef.add(postData);

        // Update related collections
        await Promise.all([
            forumRef.update({
                postsInForum: FieldValue.arrayUnion(newPostRef),
            }),
        ]);

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
        const userId = req.body.userId; // signed-in user's UID
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

        if (authorId !== userId) {
            return res.status(403).send({
                status: "Forbidden",
                message: "You are not authorized to edit this post.",
            });
        }

        const updates: Partial<Post> = {};
        if (req.body.title) updates.title = req.body.title;
        if (req.body.contents) updates.contents = req.body.contents;
        updates.timeUpdated = Timestamp.fromDate(new Date());
        updates.edited = true; // Mark post as edited

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


// -------- Helper functions for deleteDoc -------- //
// --- Helper function for deleteDoc that recursively deletes replies and their nested replies --- //
const deleteRepliesRecursive = async (replyRefs: FirebaseFirestore.DocumentReference[]) => {
    for (const replyRef of replyRefs) {
        const replyDoc = await replyRef.get();
        if (!replyDoc.exists) continue;

        const replyData = replyDoc.data();
        if (replyData?.listOfReplies?.length) {
            await deleteRepliesRecursive(replyData.listOfReplies);
        }

        await replyRef.delete();
    } // end for
} // end helper function deleteRepliesRecursive

// --- Helper function for deleteDoc to check if user is authorized to delete a post --- //
const isUserAuthorizedToDeletePost = async ( userId: string, postData: FirebaseFirestore.DocumentData, communityId?: string ): Promise<boolean> => {
    const authorPath = postData?.author?.path;
    const authorId = authorPath?.split("/")[1];

    // Author can always delete
    if (authorId === userId) return true;

    // If not author, check if user is mod/owner of community
    if (communityId) {
        const communityRef = db.collection("Community").doc(communityId);
        const communityDoc = await communityRef.get();
        if (communityDoc.exists) {
            const communityData = communityDoc.data();
            const userRef = db.doc(`/Users/${userId}`);
            const ownerList: FirebaseFirestore.DocumentReference[] = communityData?.ownerList || [];
            const modList: FirebaseFirestore.DocumentReference[] = communityData?.modList || [];

            const isOwner = ownerList.some(ref => ref.path === userRef.path);
            const isMod = modList.some(ref => ref.path === userRef.path);

            if (isOwner || isMod) return true;
        }
    }

    return false;
};

// Delete post (Can only be done by author or community mods)
const deleteDoc = async (req: Request, res: Response) => {
    try {
        const postId = req.params.id;   // id of the post being deleted
        const userId = req.body.userId;     // userId of the user requesting deletion
        // TODO: ↓↓↓ Fix this up once forums are implemented ↓↓↓
        const communityId = req.body.communityId; // the forum/community this post belongs to

        const postRef = db.collection("Posts").doc(postId);
        const postDoc = await postRef.get();

        if (!postDoc.exists) {
            return res.status(404).send({ status: "Not Found", message: "Post not found" });
        }

        const postData = postDoc.data();
        // const authorPath = postData?.author?.path; // "Users/<uid>"

        // Default: only the author can delete --- checks if the requestor is the author 
        const authorized = await isUserAuthorizedToDeletePost(userId, postData!, communityId);
        if (!authorized) {
            return res.status(403).send({
                status: "Forbidden",
                message: "You are not authorized to delete this post.",
            });
        }

        // Delete all replies recursively
        console.log("Deleting replies...");
        const replyRefs: FirebaseFirestore.DocumentReference[] = postData?.listOfReplies || [];
        await deleteRepliesRecursive(replyRefs);
        console.log("All replies deleted.");

        // Dereference post from parent forum
        console.log("Dereferencing post from parent forum...");
        const parentForumRef: DocumentReference = postData?.parentForum;
        if (parentForumRef) {
            console.log("Dereferencing post from parent forum...");
            await parentForumRef.update({
                postsInForum: FieldValue.arrayRemove(postRef),
            });
            console.log("Dereferencing complete.");
        }
        console.log("Dereferencing complete.");

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
        const { id, userId, type } = req.body; // type: "yay" | "nay"
        if (!["yay", "nay"].includes(type)) {
            return res.status(400).send({
                status: "error", 
                message: "Invalid vote type" 
            });
        }

        const postRef = db.collection("Posts").doc(id);
        const postSnap = await postRef.get();
        if (!postSnap.exists) return res.status(404).send({
            status: "error", 
            message: "Post not found" 
        });

        const postData = postSnap.data()!;
        const userRef = db.doc(`/Users/${userId}`);

        // Extract current lists
        const yayList: FirebaseFirestore.DocumentReference[] = postData.yayList || [];
        const nayList: FirebaseFirestore.DocumentReference[] = postData.nayList || [];

        const liked = yayList.some(ref => ref.path === userRef.path);
        const disliked = nayList.some(ref => ref.path === userRef.path);

        let updatedYayList = yayList;
        let updatedNayList = nayList;
        let yayScore = postData.yayScore || 0;

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

        await postRef.update({
            yayList: updatedYayList,
            nayList: updatedNayList,
            yayScore,
        });

        res.status(200).send({ status: "OK", message: "Vote updated", yayScore });
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

// Helper function for getPostById to retrieve replies for a post
const fetchRepliesRecursively = async (replyRefs: DocumentReference[] = []): Promise<Reply[]> => {
    if (!replyRefs || replyRefs.length === 0) {
        return [];
    }
    const replies: Reply[] = [];

    for (const ref of replyRefs) {
        const replySnap = await ref.get();
        if (!replySnap.exists) continue;

        const replyData = replySnap.data();

        // Dereference reply author
        let replyAuthorUsername = "Unknown";
        let replyAuthorId = "Unknown";
        if (replyData?.author?.get) {
            const authorSnap = await replyData.author.get();
            replyAuthorUsername = authorSnap.exists ? authorSnap.data()?.username || "Unknown" : "Unknown";
            replyAuthorId = replyData.author.path.split("/").pop() || "Unknown";
        }

        // Convert yayList/nayList references to user IDs
        const yayList: string[] = (replyData?.yayList || []).map((ref: DocumentReference | string) =>
            typeof ref === "string" ? ref : ref.path.split("/").pop() || "Unknown"
        );
        const nayList: string[] = (replyData?.nayList || []).map((ref: DocumentReference | string) =>
            typeof ref === "string" ? ref : ref.path.split("/").pop() || "Unknown"
        );

        // Recursively fetch nested replies
        const nestedReplies = await fetchRepliesRecursively(replyData?.listOfReplies || []);

        replies.push({
            id: replySnap.id,
            contents: replyData?.contents || "",
            edited: replyData?.edited,
            ...replyData,
            authorUsername: replyAuthorUsername,
            authorId: replyAuthorId,
            yayList,
            nayList,
            timeReply: replyData?.timeReply?.toMillis(),
            listOfReplies: nestedReplies,
        });
    } // end for
    
    return replies;
};

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
        if (data?.author?.get) {
            const authorSnap = await data.author.get();
            authorUsername = authorSnap.exists ? authorSnap.data()?.username || "Unknown" : "Unknown";
            authorId = data.author.path.split("/").pop() || "Unknown";
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
import { db } from "../firebase.ts"
import { Request, Response } from "express"
import { FieldValue, DocumentReference, Timestamp } from "firebase-admin/firestore";

interface Post {
    author: DocumentReference;
    title: string;
    contents: string;
    yayScore: number;
    yayList: DocumentReference[];
    nayList: DocumentReference[];
    timePosted: Timestamp;
    timeUpdated: Timestamp;
    listOfReplies: DocumentReference[];
    edited: boolean;
}

// // Retrieves all documents in Posts
// const getAllDocuments = async (req: Request, res: Response) => {
//     try {
//         const postsRef = db.collection("Posts");
//         const snapshot = await postsRef.get();
        
//         res.status(200).send({
//             status: "OK",
//             message: snapshot.docs.map(doc => doc.data())
//         })
//     }
//     catch (err) {
//         console.log(err);
//         res.status(500).send({
//             status: "backend error",
//             message: err
//         })
//     }    
// }

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
const addDoc = async (req: Request, res: Response) => {
    try {
        const postsRef = await db.collection("Posts");
        const authorRef = db.doc("/Users/" + req.body.author);

        const data = {
            yayScore: 1,
            author: authorRef,
            listOfReplies: [],
            timePosted: Timestamp.fromDate(new Date()),
            timeUpdated: Timestamp.fromDate(new Date()),
            title: req.body.title,
            contents: req.body.contents,
            edited: false,
            yayList: [authorRef],   // author automatically likes posts
            nayList: [],
        }

        const snapshot = await postsRef.where("author", "==", data.author)
                                        .where("title", "==", data.title)
                                        .where("contents", "==", data.contents)
                                        .get();

        if (!snapshot.empty) {
            res.send(400).send({
                status: "Bad Request",
                message: "A similar post from the same user already exists!"
            })
        }
        const result = await db.collection("Posts").add(data);

        res.status(200).send({
            status: "OK",
            message: "Successfully added to Posts, " + result.id,
            docId: result.id
        })
    }
    catch (err) {
        res.status(500).send({
            status: "Backend error: Could not add document to Posts",
            message: err
        })
    }
} // end addDoc

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
        const authorPath = postData?.author?.path; // "Users/<uid>"
        const authorId = authorPath?.split("/")[1];

        // Default: only the author can delete --- checks if the requestor is the author 
        let authorized = authorId === userId;

        // If not author, check if user is mod/owner of community
        if (!authorized && communityId) {
            const communityRef = db.collection("Community").doc(communityId);
            const communityDoc = await communityRef.get();

            if (communityDoc.exists) {
                const communityData = communityDoc.data();

                const userRef = db.doc(`/Users/${userId}`);

                const ownerList: FirebaseFirestore.DocumentReference[] = communityData?.ownerList || [];
                const modList: FirebaseFirestore.DocumentReference[] = communityData?.modList || [];

                const isOwner = ownerList.some(ref => ref.path === userRef.path);
                const isMod = modList.some(ref => ref.path === userRef.path);

                if (isOwner || isMod) authorized = true;
            } // end if
        } // end if

        if (!authorized) {
            return res.status(403).send({
                status: "Forbidden",
                message: "You are not authorized to delete this post.",
            });
        }

        // Delete the document from Firestore
        await postRef.delete();

        return res.status(200).send({
            status: "OK",
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

const votePost = async (req: Request, res: Response) => {
    try {
        const { postId, userId, type } = req.body; // type: "yay" | "nay"
        if (!["yay", "nay"].includes(type)) {
            return res.status(400).send({
                status: "error", 
                message: "Invalid vote type" 
            });
        }

        const postRef = db.collection("Posts").doc(postId);
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
        const id = req.params.id;
        const reply = req.body.replyId;
        const replyRef = await db.collection("Replies").doc(reply);

        if (!replyRef) {
            res.send(400).send({
                status: "Bad Request",
                message: "Reply document reference does not exist in Replies"
            });
        }

        const post = await db.collection("Posts").doc(id);
        const result = await post.update({
            listOfReplies: FieldValue.arrayUnion(db.doc(`/Replies/${reply}`))
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

export {
    getAllDocuments,
    addDoc,
    replyToPost,
    editDoc,
    deleteDoc,
    votePost,
}
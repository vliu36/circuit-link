import { DocumentReference, FieldValue, Timestamp } from "firebase-admin/firestore";
import { db } from "../firebase.ts"
import { Request, Response } from "express"
import { deletePostRepliesRecursive } from "./_utils/replyUtils.ts";

// Retrieves all documents in Replies collection
const getAllDocuments = async (req: Request, res: Response) => {
    try {
        const snapshot = await db.collection("Replies").get();
        res.status(200).json({
            status: "OK",
            message: snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })),
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ status: "Backend error", message: err });
    }
};

// --- Create a new reply ---
const createReply = async (req: Request, res: Response) => {
    try {
        const { author, postId, contents } = req.body;
        if (!author || !postId || !contents) {
            return res.status(400).json({ status: "error", message: "Missing fields" });
        }

        const authorRef = db.doc(`/Users/${author}`);
        const postRef = db.doc(`/Posts/${postId}`);
        const postSnap = await postRef.get();

        if (!postSnap.exists) return res.status(404).json({ status: "Not Found", message: "Post not found" });
        const postData = postSnap.data();

        const data = {
            author: authorRef,
            parentPost: postRef,
            parentForum: postData?.parentForum,
            parentGroup: postData?.parentGroup,
            parentCommunity: postData?.parentCommunity,
            listOfReplies: [],
            contents,
            yayList: [authorRef],
            nayList: [],
            yayScore: 1,
            timeReply: Timestamp.fromDate(new Date()),
            timeUpdated: Timestamp.fromDate(new Date()),
            edited: false,
        };

        const replyRef = await db.collection("Replies").add(data);

        // Update author's yayScore
        await authorRef.update({
            yayScore: FieldValue.increment(1),
        });

        res.status(200).json({ status: "OK", message: "Reply added", docId: replyRef.id });
    } catch (err) {
        console.error(err);
        res.status(500).json({ status: "Backend error", message: err });
    }
};

// --- Reply to a reply ---
const replyToReply = async (req: Request, res: Response) => {
    try {
        const { id } = req.params; // parent reply
        const { replyId } = req.body; // reply being added
        if (!id || !replyId) return res.status(400).json({ status: "error", message: "Missing reply IDs" });

        const parentRef = db.collection("Replies").doc(id);
        await parentRef.update({ listOfReplies: FieldValue.arrayUnion(db.doc(`/Replies/${replyId}`)) });

        // Increment replyCount in parent post
        const parentSnap = await parentRef.get();
        const parentData = parentSnap.data();
        const parentPostRef = db.doc(parentData?.parentPost?.path);
        await parentPostRef.update({
            replyCount: FieldValue.increment(1),
        });

        // Update community's yayScore
        const commRef: FirebaseFirestore.DocumentReference = parentData?.parentCommunity;
        await commRef.update({
            yayScore: FieldValue.increment(1),
        });
        res.status(200).json({ status: "OK", message: "Reply added to parent reply" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ status: "Backend error", message: err });
    }
};

// --- Vote on a reply ---
const voteReply = async (req: Request, res: Response) => {
    try {
        const { id, userId, type } = req.body;
        if (!["yay", "nay"].includes(type)) return res.status(400).json({ status: "error", message: "Invalid vote type" });

        const replyRef = db.collection("Replies").doc(id);

        await db.runTransaction(async (transaction) => {
            const replySnap = await transaction.get(replyRef);
            if (!replySnap.exists) throw new Error("Reply not found");

            const replyData = replySnap.data();
            const userRef = db.doc(`/Users/${userId}`);
            
            const yayList: DocumentReference[] = replyData?.yayList || [];
            const nayList: DocumentReference[] = replyData?.nayList || [];

            // Old score
            const oldYayScore = replyData?.yayScore || 0;
            let yayScore = oldYayScore;

            const liked = yayList.some((ref) => ref.path === userRef.path);
            const disliked = nayList.some((ref) => ref.path === userRef.path);
            let updatedYayList = [...yayList];
            let updatedNayList = [...nayList];

            // Fetch parent community
            const commRef: FirebaseFirestore.DocumentReference = replyData?.parentCommunity;
            const commSnap = await transaction.get(commRef);
            if (!commSnap.exists) throw new Error("Community not found");
            
            // Vote logic
            if (type === "yay") {
                if (liked) {
                    updatedYayList = updatedYayList.filter((ref) => ref.path !== userRef.path);
                    yayScore -= 1;
                } else {
                    if (disliked) {
                        updatedNayList = updatedNayList.filter((ref) => ref.path !== userRef.path);
                        yayScore += 1;
                    }
                    updatedYayList.push(userRef);
                    yayScore += 1;
                }
            } else {
                if (disliked) {
                    updatedNayList = updatedNayList.filter((ref) => ref.path !== userRef.path);
                    yayScore += 1;
                } else {
                    if (liked) {
                        updatedYayList = updatedYayList.filter((ref) => ref.path !== userRef.path);
                        yayScore -= 1;
                    }
                    updatedNayList.push(userRef);
                    yayScore -= 1;
                }
            }

            // Update reply document
            transaction.update(replyRef, { 
                yayList: updatedYayList, 
                nayList: updatedNayList, 
                yayScore 
            });

            // Update author's community's yayScore based on difference
            const authorRef: FirebaseFirestore.DocumentReference = replyData?.author;
            const diff = yayScore - oldYayScore;
            if (diff !== 0) {
                // Update community yayScore
                transaction.update(commRef, {
                    yayScore: FieldValue.increment(diff),
                });
                // Update author's yayScore based on difference
                transaction.update(authorRef, {
                    yayScore: FieldValue.increment(diff),
                });
            }
        }); // end of transaction

        // await replyRef.update({ yayList: updatedYayList, nayList: updatedNayList, yayScore });
        res.status(200).json({ status: "OK", message: "Vote updated" });
    } catch (err) {
        console.error(err);
        if (err instanceof Error) {
            if (err.message.includes("not found")) {
                return res.status(404).json({ status: "error", message: err.message });
            } else {
                res.status(500).json({ status: "error", message: err.message });
            }
        } else {
            res.status(500).json({ status: "error", message: "Unknown error" });
        }
    }
};

// --- Delete a reply ---
const deleteDoc = async (req: Request, res: Response) => {
    try {
        const { replyId } = req.params;
        const { userId, communityId } = req.body;

        const replyRef = db.collection("Replies").doc(replyId);
        const replySnap = await replyRef.get();
        if (!replySnap.exists) return res.status(404).json({ 
            status: "Not Found", 
            message: "Reply not found" 
        });

        const replyData = replySnap.data();
        const authorPath = replyData?.author?.path;
        const authorId = authorPath?.split("/")[1];
        let authorized = authorId === userId;

        if (!authorized && communityId) {
            const communityRef = db.collection("Communities").doc(communityId);
            const communitySnap = await communityRef.get();
            if (communitySnap.exists) {
                const communityData = communitySnap.data();
                const userRef = db.doc(`/Users/${userId}`);
                const ownerList: DocumentReference[] = communityData?.ownerList || [];
                const modList: DocumentReference[] = communityData?.modList || [];
                authorized = ownerList.some((ref) => ref.path === userRef.path) || modList.some((ref) => ref.path === userRef.path);
            }
        }
        if (!authorized) return res.status(403).json({ status: "Forbidden", message: "Not authorized to delete this reply" });

        const childReplies: DocumentReference[] = replyData?.listOfReplies || [];
        await deletePostRepliesRecursive(childReplies);
        await replyRef.delete();

        // Update yayScore in parent community
        const commRef: FirebaseFirestore.DocumentReference = replyData?.parentCommunity;
        await commRef.update({
            yayScore: FieldValue.increment(-replyData?.yayScore || 0),
        });
        // Update yayScore in author user document
        const authorRef: FirebaseFirestore.DocumentReference = replyData?.author;
        await authorRef.update({
            yayScore: FieldValue.increment(-replyData?.yayScore || 0),
        });
        // Decrement replyCount in parent post
        const parentPostRef: FirebaseFirestore.DocumentReference = replyData?.parentPost;
        await parentPostRef?.update({
            replyCount: FieldValue.increment(-1),
        });

        res.status(200).json({ status: "OK", message: `Reply ${replyId} deleted successfully` });
    } catch (err) {
        console.error(err);
        res.status(500).json({ status: "Backend error", message: err });
    }
};

// --- Edit a reply ---
const editDoc = async (req: Request, res: Response) => {
    try {
        const { replyId } = req.params;
        const { userId, contents } = req.body;

        const replyRef = db.collection("Replies").doc(replyId);
        const replySnap = await replyRef.get();
        if (!replySnap.exists) return res.status(404).json({ status: "Not Found", message: "Reply not found" });

        const replyData = replySnap.data();
        const authorPath = replyData?.author?.path;
        const authorId = authorPath?.split("/")[1];
        if (authorId !== userId) return res.status(403).json({ status: "Forbidden", message: "Not authorized to edit" });

        await replyRef.update({ contents, timeReply: Timestamp.fromDate(new Date()), edited: true });
        res.status(200).json({ status: "OK", message: "Reply updated" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ status: "Backend error", message: err });
    }
};

export {
    getAllDocuments,
    createReply,
    replyToReply,
    voteReply,
    deleteDoc,
    editDoc,
}
import { DocumentReference, FieldValue, Timestamp } from "firebase-admin/firestore";
import { db } from "../firebase.ts"
import { Request, Response } from "express"

interface Reply {
    id: string;
    authorUsername: string;
    authorId: string;
    yayList: string[];
    nayList: string[];
    timeReply: Timestamp;
    listOfReplies: DocumentReference[];
    edited: boolean;
    contents: string;
    parentPost: DocumentReference;
    parentForum?: DocumentReference;
    parentGroup?: DocumentReference;
    parentCommunity?: DocumentReference;
}

// --- Helper: delete nested replies recursively ---
const deleteRepliesRecursive = async (replyRefs: DocumentReference[]) => {
    for (const rRef of replyRefs) {
        const rDoc = await rRef.get();
        if (!rDoc.exists) continue;
        const rData = rDoc.data();
        if (rData?.listOfReplies?.length) {
            await deleteRepliesRecursive(rData.listOfReplies);
        }
        await rRef.delete();
        // Decrement replyCount in parent post
        const parentPostRef: DocumentReference | undefined = rData?.parentPost;
        await parentPostRef?.update({
            replyCount: FieldValue.increment(-1),
        });
    }
};

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
        const replySnap = await replyRef.get();
        if (!replySnap.exists) return res.status(404).json({ status: "error", message: "Reply not found" });

        const replyData = replySnap.data();
        const userRef = db.doc(`/Users/${userId}`);
        const yayList: DocumentReference[] = replyData?.yayList || [];
        const nayList: DocumentReference[] = replyData?.nayList || [];
        let yayScore = replyData?.yayScore || 0;

        const liked = yayList.some((ref) => ref.path === userRef.path);
        const disliked = nayList.some((ref) => ref.path === userRef.path);

        let updatedYayList = [...yayList];
        let updatedNayList = [...nayList];

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

        await replyRef.update({ yayList: updatedYayList, nayList: updatedNayList, yayScore });
        res.status(200).json({ status: "OK", message: "Vote updated", yayScore });
    } catch (err) {
        console.error(err);
        res.status(500).json({ status: "error", message: err });
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
        await deleteRepliesRecursive(childReplies);
        await replyRef.delete();

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
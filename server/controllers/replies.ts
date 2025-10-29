import { DocumentReference, FieldValue, Timestamp } from "firebase-admin/firestore";
import { db } from "../firebase.ts"
import { Request, Response } from "express"

// Retrieves all documents in Replies
const getAllDocuments = async (req: Request, res: Response) => {
    try {
        const repliesRef = db.collection("Replies");
        const snapshot = await repliesRef.get();
        
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

// Creates and adds a document in Replies
const createReply = async (req: Request, res: Response) => {
    try {
        const postsRef = await db.collection("Replies");
        const authorRef = db.doc("/Users/" + req.body.author);
        // const parentReply = db.doc("/Replies/" + req.body.parentId);
        
        const data = {
            yayScore: 1,
            author: authorRef,
            listOfReplies: [],
            timeReply: Timestamp.fromDate(new Date()),
            contents: req.body.contents,
            timeUpdated: Timestamp.fromDate(new Date()),
            edited: false,
            yayList: [authorRef],   // author automatically likes posts
            nayList: [],
            // parent: DocumentReference,
        }

        const result = await db.collection("Replies").add(data);

        res.status(200).send({
            status: "OK",
            message: "Successfully added to Replies, " + result.id,
            docId: result.id
        })
    }
    catch (err) {
        res.status(500).send({
            status: "Backend error: Could not add document to Replies",
            message: err
        })
    }
}

// Adds a reply to an existing reply
const replyToReply = async (req: Request, res: Response) => {
    try {
        const id = req.params.id;
        const reply = req.body.replyId;
        const replyRef = await db.collection("Replies").doc(reply);
        // const parentReply = db.doc("/Replies/" + id);

        if (!replyRef) {
            res.send(400).send({
                status: "Bad Request",
                message: "Reply document reference does not exist in Replies"
            });
        }

        const post = await db.collection("Replies").doc(id);
        const result = await post.update({
            listOfReplies: FieldValue.arrayUnion(db.doc(`/Replies/${reply}`)),
            // parent: parentReply,
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

// Yays and Nays for replies
const voteReply = async (req: Request, res: Response) => {
    try {
        const { id, userId, type } = req.body; // type: "yay" | "nay"
        if (!["yay", "nay"].includes(type)) {
            return res.status(400).send({
                status: "error", 
                message: "Invalid vote type" 
            });
        }

        const replyRef = db.collection("Replies").doc(id);
        const replySnap = await replyRef.get();
        if (!replySnap.exists) return res.status(404).send({
            status: "error", 
            message: "Reply not found" 
        });

        const replyData = replySnap.data()!;
        const userRef = db.doc(`/Users/${userId}`);

        // Extract current lists
        const yayList: FirebaseFirestore.DocumentReference[] = replyData.yayList || [];
        const nayList: FirebaseFirestore.DocumentReference[] = replyData.nayList || [];

        const liked = yayList.some(ref => ref.path === userRef.path);
        const disliked = nayList.some(ref => ref.path === userRef.path);

        let updatedYayList = yayList;
        let updatedNayList = nayList;
        let yayScore = replyData.yayScore || 0;

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

        await replyRef.update({
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

export {
    getAllDocuments,
    createReply,
    replyToReply,
    voteReply
}
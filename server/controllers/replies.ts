import { FieldValue, Timestamp } from "firebase-admin/firestore";
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

        const data = {
            yayScore: 1,
            author: db.doc("/Users/" + req.body.author),
            listOfReplies: [],
            timeReply: Timestamp.fromDate(new Date()),
            contents: req.body.contents
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

        if (!replyRef) {
            res.send(400).send({
                status: "Bad Request",
                message: "Reply document reference does not exist in Replies"
            });
        }

        const post = await db.collection("Replies").doc(id);
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
    createReply,
    replyToReply
}
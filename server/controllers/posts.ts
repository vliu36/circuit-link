import { db } from "../firebase.ts"
import { Request, Response } from "express"
import { Timestamp } from "firebase-admin/firestore";

// Retrieves all documents in Posts
const getAllDocuments = async (req: Request, res: Response) => {
    try {
        const postsRef = db.collection("Posts");
        const snapshot = await postsRef.get();
        
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

// Creates and adds a document in Posts
const addDoc = async (req: Request, res: Response) => {
    try {
        const postsRef = await db.collection("Posts");

        const data = {
            yayScore: 1,
            author: db.doc("/Users/" + req.body.author),
            listOfReplies: [],
            timePosted: Timestamp.fromDate(new Date()),
            title: req.body.title,
            contents: req.body.contents
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
            message: "Successfully added to Posts, " + result.id
        })
    }
    catch (err) {
        res.status(500).send({
            status: "Backend error: Could not add document to Posts",
            message: err
        })
    }
}

export {
    getAllDocuments,
    addDoc
}
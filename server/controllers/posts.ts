import { db } from "../firebase.ts"
import { Request, Response } from "express"
import { FieldValue, Timestamp } from "firebase-admin/firestore";

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

// Retrieves all documents in Posts (modified to get post authors from Users)
const getAllDocuments = async (req: Request, res: Response) => {
    try {
        const snapshot = await db.collection("Posts").orderBy("timePosted", "desc").get();

        const posts = await Promise.all(
            snapshot.docs.map(async (doc) => {
                const data = doc.data();

                // Check if author exists and is a DocumentReference
                let username = "Unknown";
                if (data.author?.get) {
                    const userDoc = await data.author.get(); // dereference the DocumentReference
                    username = userDoc.exists ? userDoc.data()?.username || "Unknown" : "Unknown";
                }

                return {
                    id: doc.id,
                    ...data,
                    authorUsername: username,
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
}

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
    replyToPost
}
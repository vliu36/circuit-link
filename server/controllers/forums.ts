import { db } from "../firebase.ts"
import { Request, Response } from "express"
import { Timestamp } from "firebase-admin/firestore";

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

// Creates and adds a document in Forums
const addDoc = async (req: Request, res: Response) => {
    try {
        const { name, description, userId } = req.body;
        const forumsRef = await db.collection("Forums");
        const snapshot = await forumsRef.where("name", "==", name).get();
        
        // Create a slug of the forum name to be used as part of the URL
        const slug = name
            .toLowerCase()              
            .trim()             
            .replace(/\s+/g, "-")       // Replace spaces with dashes
            .replace(/[^\w-]/g, "")     // Replace non-word characters with an empty string
            .replace(/--+/g, "-");      // Replace multiple dashes with a single dash

        const slugSnap = await forumsRef.where("slug", "==", slug).get();

        if (!snapshot.empty || !slugSnap.empty) {
            res.send(400).send({
                status: "Bad Request",
                message: "Forum already exists!"
            });
        }

        const userRef = db.doc(`/Users/${userId}`);

        const data = {
            dateCreated: Timestamp.fromDate(new Date()),
            description,
            name,
            slug,
            ownerList: [userRef],
        }
        const result = await db.collection("Forums").add(data);

        res.status(201).send({
            status: "OK",
            message: "Successfully created Forum, " + result.id,
            docId: result.id
        })
    } catch (err) {
        res.status(500).send({
            status: "Backend error: Could not add document to Communities",
            message: err
        })
    } // end try catch
} // end addDoc

export {
    getAllDocuments,
    addDoc,
}
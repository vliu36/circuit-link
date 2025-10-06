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

export {
    getAllDocuments
}
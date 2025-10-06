import { db } from "../firebase.ts"
import { Request, Response } from "express"

// Retrieves all documents in Users
const getAllDocuments = async (req: Request, res: Response) => {
    try {
        const usersRef = db.collection("Users");
        const snapshot = await usersRef.get();
        
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
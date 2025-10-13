import { db } from "../firebase.ts"
import { Request, Response } from "express"

// Retrieves all documents in Communities
const getAllDocuments = async (req: Request, res: Response) => {
    try {
        const communitiesRef = db.collection("Communities");
        const snapshot = await communitiesRef.get();
        
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

// Retrieve documents in Communities that contain the prefix value
const prefixSearch = async (req: Request, res: Response) => {
    try {
        const query = req.params.query.toLowerCase();
        if (!query) {
            res.status(400).send({
                status: "Bad Request",
                message: "Empty query!"
            })
        }
        
        const communitiesRef = db.collection("Communities").where("nameLower", ">=", query).where("nameLower", "<=", query + "\uf8ff");
        const snapshot = await communitiesRef.get();
        
        res.status(200).send({
            status: "OK",
            message: snapshot.docs.map(doc => doc.data())
        });
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
    prefixSearch
}
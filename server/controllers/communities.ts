import { Timestamp } from "firebase-admin/firestore";
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
        res.status(500).send({
            status: "backend error",
            message: err
        })
    }    
}

// Creates and adds a document in Community
const addDoc = async (req: Request, res: Response) => {
    try {
        const communitiesRef = await db.collection("Communities");
        const snapshot = await communitiesRef.where("name", "==", req.body.name).get();

        if (!snapshot.empty) {
            res.send(400).send({
                status: "Bad Request",
                message: "Community already exists!"
            })
        }

        const data = {
            blacklist: req.body.blacklist,
            dateCreated: Timestamp.fromDate(new Date()),
            description: req.body.description,
            groupsInCommunity: req.body.groups,
            modList: req.body.modList,
            name: req.body.name,
            nameLower: req.body.name.toLowerCase(),
            numUsers: req.body.userList.length,
            ownerList: req.body.ownerList,
            public: req.body.public,
            userList: req.body.userList,
            yayScore: 0
        }
        const result = await db.collection("Communities").add(data);

        console.log("data added")
        res.status(200).send({
            status: "OK",
            message: "Successfully added to Communities, " + result.id
        })
    }
    catch (err) {
        res.status(500).send({
            status: "Backend error: Could not add document to Communities",
            message: err
        })
    }
}

// Retrieves a document in Community by exact name (case sensitive)
const getDocByName = async (req: Request, res: Response) => {
    try {
        const query = req.params.name;
        const communitiesRef = await db.collection("Communities");
        const snapshot = await communitiesRef.where("name", "==", query).get();

        if (snapshot.empty) {
            res.status(500).send({
                status: "Backend error",
                message: "Cannot find document with name: " + query
            })
        }
        
        res.status(200).send({
            status: "OK",
            message: snapshot.docs.map(doc => doc.data())
        })
    }
    catch (err) {
        res.status(500).send({
            status: "Backend error",
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

// Updates the blacklist of an existing document
const updateDoc = async (req: Request, res: Response) => {
    //TODO: Complete code stub
}

export {
    getAllDocuments,
    prefixSearch,
    addDoc,
    getDocByName,
    updateDoc
}
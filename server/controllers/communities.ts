import { DocumentReference, Timestamp } from "firebase-admin/firestore";
import { db } from "../firebase.ts";
import { Request, Response } from "express";

interface Forum {
    id: string,
    name: string,
    slug: string,
    description?: string,
}

interface Group {
    id: string,
    name: string,
    forums: Forum[],
}

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

        res.status(201).send({
            status: "OK",
            message: "Successfully added to Communities, " + result.id,
            docId: result.id
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
            res.status(404).send({
                status: "Not found",
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

const getCommunityStructure = async (req: Request, res: Response) => {
    try {
        const communityName = req.params.name;

        // Get community document
        const communitiesRef = db.collection("Communities");
        const snapshot = await communitiesRef.where("name", "==", communityName).get();

        if (snapshot.empty) {
            return res.status(404).send({
                status: "Not found",
                message: `Community of name "${communityName}" not found.`,
            });
        }

        const communityDoc = snapshot.docs[0];
        const communityData = communityDoc.data();
        const groupsRefs = communityData.groupsInCommunity || [];

        // Fetch all groups
        const groupsInCommunity: Group[] = [];
        for (const groupRef of groupsRefs) {
            const groupSnap = await groupRef.get();
            if (!groupSnap.exists) continue;

            const groupData = groupSnap.data();
            const forumsRefs = groupData.forumsInGroup || [];

            // Fetch all forums for the current group
            const forumsInGroup: Forum[] = [];
            for (const forumRef of forumsRefs) {
                const forumSnap = await forumRef.get();
                if (!forumSnap.exists) continue;
                forumsInGroup.push({ id: forumSnap.id, ...forumSnap.data() }); // TODO: Attempt to omit sending posts
            } // end for forumsRefs

            groupsInCommunity.push({
                id: groupSnap.id,
                ...groupData,
                forumsInGroup,
            });
        } // end for groupsRefs

        res.status(200).send({
            status: "ok",
            community: {
                id: communityDoc.id,
                name: communityData.name,
                description: communityData.description,
                groupsInCommunity,
            },
        });
    } catch (err) {
        console.error("Error fetching community structure:", err);
        res.status(500).send({
            status: "Backend error",
            message: err instanceof Error? err.message : err,
        });
    } // end try catch
} // end getCommunityStructure

export {
    getAllDocuments,
    prefixSearch,
    addDoc,
    getDocByName,
    updateDoc,
    getCommunityStructure
}
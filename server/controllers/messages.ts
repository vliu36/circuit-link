// Functions for Messages API

import { db } from "../firebase.ts";
import { Request, Response } from "express";
import { getCommunityByName } from "./_utils/commUtils";
import { DocumentReference, Timestamp } from "firebase-admin/firestore";

// Retrieve all documents in the messages collection
const getAllMessages = async (req: Request, res: Response) => {
    try {
        const messagesRef = db.collection("Messages");
        const snapshot = await messagesRef.get();
        
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

// Creates a new message and puts it in the messages collection
const addMessage = async (req: Request, res: Response) => {
    try {
        const { author, contents, media, receiver, isDirect} = req.body;

        if (!author || !contents || !receiver) {
            res.status(400).send({
                status: "Bad Request",
                message: "ERROR: Missing required fields"
            });
        }

        // Retrieves the community or user reference depending on whether or not it is a direct message
        const receiverRef = isDirect == 1 ? db.doc(`/Users/${receiver}`) : await getCommunityByName(receiver);

        const timestamp = Timestamp.fromDate(new Date());
        const authorRef = db.doc(`/Users/${author}`)
        
        const newMessage = {
            author: authorRef,
            contents: contents,
            isDirect: isDirect,
            media: media || "",
            receiver: receiverRef,
            timestamp: timestamp
        }

        // Add to messages collection
        const messagesRef = db.collection("Messages");
        const newMessageRef = await messagesRef.add(newMessage);

        res.status(201).send({
            status: "Created",
            message: newMessageRef
        });
    }
    catch (err) {
        res.status(500).send({
            status: "Backend Error",
            message: err
        })
    }
}

// Retrieves messages matching a receiver up to the given timestamp
const getChatBeforeTime = async (req: Request, res: Response) => {
    try {
        const { receiver, time, isDirect } = req.params;

        if (!receiver || !time) {
            res.status(400).send({
                status: "Bad Request",
                message: "ERROR: Missing required fields"
            });
        }

        // Retrieves the community or user reference depending on whether or not it is a direct message
        const receiverRef = Number(isDirect) == 1 ? db.doc(`/Users/${receiver}`) : await getCommunityByName(receiver);
        const queryTimestamp = Timestamp.fromDate(new Date(time));

        const matchingMessages = db.collection("Messages").where("receiver", "==", receiverRef).where("timestamp", "<=", queryTimestamp);
        const messageSnapshot = await matchingMessages.get();

        // Retrieve references of all matching messages
        let messagesRef: DocumentReference[] = [];
        messageSnapshot.docs.map((doc) => {
            messagesRef.push(doc.ref);
        })

        res.status(200).send({
            status: "OK",
            messages: messagesRef
        });
    }
    catch (err) {
        res.status(500).send({
            status: "Backend Error",
            message: err
        })
    }
}

// Retrieves messages matching a receiver between two timestamps
const getChatBetweenTime = async (req: Request, res: Response) => {
    try {
        const { receiver, afterTime, beforeTime, isDirect } = req.params;

        if (!receiver || !afterTime || !beforeTime) {
            res.status(400).send({
                status: "Bad Request",
                message: "ERROR: Missing required fields"
            });
        }

        // Retrieves the community or user reference depending on whether or not it is a direct message
        const receiverRef = Number(isDirect) == 1 ? db.doc(`/Users/${receiver}`) : await getCommunityByName(receiver);
        const queryAfter = Timestamp.fromDate(new Date(afterTime));
        const queryBefore = Timestamp.fromDate(new Date(beforeTime));

        const matchingMessages = db.collection("Messages").where("receiver", "==", receiverRef).where("timestamp", ">=", queryAfter).where("timestamp", "<=", queryBefore);
        const messageSnapshot = await matchingMessages.get();

        // Retrieve references of all matching messages
        let messagesRef: DocumentReference[] = [];
        messageSnapshot.docs.map((doc) => {
            messagesRef.push(doc.ref);
        })

        res.status(200).send({
            status: "OK",
            messages: messagesRef
        });
    }
    catch (err) {
        res.status(500).send({
            status: "Backend Error",
            message: err
        })
    }
}

export {
    getAllMessages,
    addMessage,
    getChatBeforeTime,
    getChatBetweenTime
}

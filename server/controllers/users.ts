import { db } from "../firebase.ts";
import { Request, Response } from "express";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

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

// Signs up a user, storing information in the Firestore Database
const userRegistration = async (req: Request, res: Response) => {
    try {
        // **Token Validation and Decoding**:
        // 1. Extract the authentication token from the request headers.
        const authHeader = req.headers.authorization;
        
        // ~~~~ for debugging
        console.log("Auth header received:", req.headers.authorization);

        // **Error Handling:** If the `Authorization` header is missing or invalid, return a 401 Unauthorized response with an error message.
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            res.status(401).json({ error: "Missing or invalid authorization header" });
            return;
        }

        // 2. Extract the ID token from the `Authorization` header and verify it using Firebase Authentication's `verifyIdToken()` method.
        const idToken = authHeader.split("Bearer ")[1];
        const decoded = await getAuth().verifyIdToken(idToken);

        // **Accessing Firestore:** Create a reference to the Firestore database using `getFirestore()`, and use this reference to set a new document in the "Users" collection.
        // 3. Set the new user document with the decoded email, username, and creation timestamp.
        const db = getFirestore();
        await db.collection("Users").doc(decoded.uid).set({
            email: decoded.email,
            password: req.body.password,                // May or may not be secure
            username: req.body.username,
            createdAt: new Date(),
            profileDesc: "Hi! I'm still setting up my profile." // Default profile description/bio
            // TODO: Include default profile picture upon account creation ----------------------------------------------------------------[!]
        });

        // **Success Response:** Return a 201 Created response with a success message.
        res.status(201).send({ message: "User created successfully" });
    } catch (err) {
        // **Error Handling:** Catch any errors that occur during the registration process and return a 500 Internal Server Error response with an error message.
        console.error(err);
        res.status(500).send({ 
            status: "backend error",
            message: err
        })
    }
};

// Logging in a user and verifying token
const userLogin = async (req: Request, res: Response) => {
    try {
        // Get authorization header
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({ error: "Missing or invalid authorization header" });
        } // end if
        
        // Extract ID token from header
        const idToken = authHeader?.split(" ")[1];
        // Verify ID token with Firebase Admin SDK
        const decoded = await getAuth().verifyIdToken(idToken);

        // Send success response
        res.status(200).json({ 
            status: "success",
            message: "User logged in successfully"
        });
        console.log("Success");
    } catch (err) {
        console.error(err);
        res.status(401).json({ error: "Invalid or expired token" })
    } // end try catch
}

export {
    getAllDocuments,
    userRegistration,
    userLogin
}

import { db } from "../firebase.ts";
import { Request, Response } from "express";
import { getAuth as getAdminAuth } from "firebase-admin/auth";
// import { GoogleAuth } from "google-auth-library";
import { getFirestore } from "firebase-admin/firestore";
// import { signInWithEmailAndPassword } from "firebase/auth";
// import {getAuth} from "firebase/auth";

const auth = getAdminAuth();

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
        const { email, password, username } = req.body;

        // Creates a new Firebase Authentication user 
        const userCred = auth.createUser({
            email: email,
            // emailVerified: false,
            // phoneNumber: req.body.phoneNumber,
            password: password,
            displayName: username,
            // photoURL: // TODO: Include default profile picture here ---------------------------------------------------------------------------------------------------[!]
            // disabled: false
        })

        // Gets the newly created user's ID
        const userId = (await userCred).uid;

        // Creates a new Firestore document for the user with their uid
        const db = getFirestore();
        await db.collection("Users").doc(userId).set({
            email: email, 
            password: password,
            username: username,
            createdAt: new Date(),
            profileDesc: "Hi! I'm still setting up my profile."
        });

        res.status(201).json({ message: "User created successfully", uid: userId })
    } 
    catch (err) {
        console.error("Error creating user:", err);
        res.status(500).send({ 
            status: "backend error",
            message: "Failed to register user. " + err
        }); 
    } // end try catch
} // end function userRegistration

// Sets up default user values for Google sign-in
const setupGoogleUser = async (req: Request, res: Response) => {
    const { email, username } = req.body;
    const uid = req.body.uid; // User's Firebase Authentication UID

    try {
        const db = getFirestore();
        await db.collection("Users").doc(uid).set({
            email: email, 
            username: username,
            createdAt: new Date(),
            profileDesc: "Hi! I'm still setting up my profile."
        });

        res.status(201).json({ message: "Google user setup successfully", uid: uid })
    } catch (err) {
        console.error("Error setting up Google user:", err);
    } // end try catch
} // end function setupGoogleUser

// Delete user document
const deleteUserDocument = async (req: Request, res: Response) => {
    const uid = req.params.uid;

    try {
        const db = getFirestore();
        await db.collection("Users").doc(uid).delete();
        res.status(201).json({ message: "Document deleted successfully", uid: uid })
    } catch (err) {
        res.status(500).send({ 
            status: "backend error",
            message: "Failed to delete user document. " + err
        });
        console.error("Error deleting user document:", err);
    } // end try catch
} // end function deleteUserDocument

export {
    getAllDocuments,
    userRegistration,
    setupGoogleUser,
    deleteUserDocument
}

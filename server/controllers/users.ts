import { db } from "../firebase.ts";
import { Request, Response } from "express";
import { getAuth as getAdminAuth } from "firebase-admin/auth";
// import { GoogleAuth } from "google-auth-library";
import { FieldValue, getFirestore } from "firebase-admin/firestore";
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
            emailVerified: false,
            // phoneNumber: req.body.phoneNumber,
            password: password,
            // photoURL: "https://storage.googleapis.com/circuit-link-images/profiles/default.png", // Swap to this default image later
            photoURL: "https://upload.wikimedia.org/wikipedia/commons/a/ac/Default_pfp.jpg",
            displayName: username,
        })

        // Gets the newly created user's ID
        const userId = (await userCred).uid;

        // Creates a new Firestore document for the user with their uid
        // const db = getFirestore();
        await db.collection("Users").doc(userId).set({
            email: email, 
            password: password,
            username: username,
            createdAt: new Date(),
            profileDesc: "Hi! I'm still setting up my profile.",
            darkMode: true,
            privateMode: false,
            restrictedMode: false,
            textSize: 12,           // TODO: Change to a different default size
            font: "Arial",          // TODO: Change to a different default font
            notifications: [],
            communities: [],
            friends: []
        });

        res.status(201).json({ message: "User created successfully", uid: userId })
    } 
    catch (err) {
        console.error("Error creating user:", err);
        res.status(500).send({ 
            status: "backend error",
            message: "Failed to register user.\n" + err
        }); 
    } // end try catch
} // end function userRegistration

// Sets up default user values for Google sign-in
const setupGoogleUser = async (req: Request, res: Response) => {
    const { email, username } = req.body;
    const uid = req.body.uid; // User's Firebase Authentication UID

    try {
        // const db = getFirestore();
        await db.collection("Users").doc(uid).set({
            email: email, 
            username: username,
            createdAt: new Date(),
            profileDesc: "Hi! I'm still setting up my profile.",
            darkMode: true,
            privateMode: false,
            restrictedMode: false,
            textSize: 12,           // TODO: Change to a different default size
            font: "Arial",          // TODO: Change to a different default font
            notifications: [],
            communities: [],
            friends: []
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
        // const db = getFirestore();
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

// Update user document communities field
const updateCommunityField = async (req: Request, res: Response) => {
    try {
        const uid = req.params.uid;
        const mode = req.body.mode;
        const commRef = req.body.community;

        if (mode) {
            const user = await db.collection("Users").doc(uid);
            await user.update({
                communities: FieldValue.arrayUnion(db.doc(`/Communities/${commRef}`))
            });
        }
        else {
            const user = await db.collection("Users").doc(uid);
            await user.update({
                communities: FieldValue.arrayRemove(db.doc(`/Communities/${commRef}`))
            });
        }

        res.status(200).send({
            status: "OK",
            message: `Successfully updated community field in document: ${uid}`
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
    userRegistration,
    setupGoogleUser,
    deleteUserDocument,
    updateCommunityField
}

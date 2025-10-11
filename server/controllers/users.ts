import { db } from "../firebase.ts";
import { Request, Response } from "express";
import { getAuth as getAdminAuth } from "firebase-admin/auth";
import { GoogleAuth } from "google-auth-library";
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
            message: err
        });
    }
};

// ---------------------------------------------------------------- REDUNDANT ----------------------------------------------------------------
// // Logging in a user and verifying token
// const userLogin = async (req: Request, res: Response) => {
//     try {
//         const { email, password } = req.body;

//         // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ NEW METHOD (needs more testing) ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
//         // Obtain access token via ADC
//         const auth = new GoogleAuth({
//             scopes: ["https://www.googleapis.com/auth/identitytoolkit"]
//         });
//         const client = await auth.getClient();
//         const accessToken = await client.getAccessToken();

//         // Call Identity Toolkit API with Bearer Token
//         const response = await fetch("https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword", {
//             method: "POST",
//             headers: {
//                 Authorization: `Bearer ${accessToken}`,
//                 "Content-Type": "application/json",
//             },
//             body: JSON.stringify({
//                 email,
//                 password,
//                 returnSecureToken: true
//             }),
//         });

//         const data = await response.json();

//         if (!response.ok) {
//             return res.status(401).json({ error: data.error?.message || "Invalid credentials"});
//         }

//         res.status(200).json({
//             message: "Login successful",
//             uid: data.localId,
//             idToken: data.idToken
//         });



        

//         // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ OLD METHOD (but still works, just needs API key) ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
//         // // Fetches the user's profile information from Firestore 
//         // const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${process.env.FIREBASE_API_KEY}`,
//         //     {                           // --------------------------------------------------------------------- ^ This requires an API key to function -----------------------------------------
//         //         method: "POST",
//         //         headers: { "Content-Type": "application/json" },
//         //         body: JSON.stringify({
//         //             email,
//         //             password,
//         //             returnSecureToken: true // Include the token in the response
//         //     }),
//         // });

//         // // Check if the response is successful
//         // const data = await response.json();
//         // if (!response.ok) {
//         //     throw new Error(data.error?.message || "Authentication failed.");
//         // }

//         // // Send the token as a response *
//         // res.status(200).json({ 
//         //     status: "success",
//         //     message: "User logged in successfully",
//         //     idToken: data.idToken,
//         //     refreshToken: data.refreshToken,
//         //     localId: data.localId   // UID
//         // });
//     } catch (err: any) {
//         console.error(err);
//         res.status(401).json({ error: err.message })
//     } // end try catch
// }

export {
    getAllDocuments,
    userRegistration,
    // userLogin
}

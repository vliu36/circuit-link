// Script for user registration page

import { GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";
import "./register-styles.css";

const provider = new GoogleAuthProvider();

// ---- User Registration ---- //
export async function register(email: string, password: string, username: string) {
    // e.preventDefault();

    // const res = await fetch("https://api-circuit-link-160321257010.us-west2.run.app/api/users/register", {
    const res = await fetch(`${process.env.SERVER_URI}/api/users/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, username }), // <--- include any extra data you want server-side
    });
    
    const data = await res.json();
    // Check if the response is successful
    if (!res.ok) {
        alert(data.message || "Failed to register user.");
        return;
    } // end if
    // Automatically log in the user after successful registration
    const user = await signInWithEmailAndPassword(auth, email, password);
    console.log("Registered user:", user);

    // Redirect to main app page after successful registration and login
    // window.location.href = "https://circuitlink-160321257010.us-west2.run.app" // TODO: uncomment when deployed
    window.location.href = "http://${process.env.CLIENT_URI}/landing"

} // end function register

// ---- Google Registration ---- //
export async function registerWithGoogle() {
    try {
        const result = await signInWithPopup(auth, provider);
        
        // This gives you a Google Access Token. You can use it to access the Google API.
        const credential = GoogleAuthProvider.credentialFromResult(result);
        const token = credential?.accessToken;

        // Check if account already exists
        const docSnap = await getDoc(doc(db, "Users", result.user.uid));
        if (docSnap.exists()) {
            console.log("Google user already exists in Firestore: ", result.user.email);
            window.location.href = "http://${process.env.CLIENT_URI}/landing";
            return; // Account exists, no need to register
        } // end if

        // Generate a default username since Google sign-in doesn't provide one
        const now = new Date();
        const day = String(now.getDate()).padStart(2, '0');
        const hour = String(now.getHours()).padStart(2, '0');
        const minute = String(now.getMinutes()).padStart(2, '0');
        const defaultUsername = "User" + day + hour + minute;       // e.g., User231430 for 23rd at 14:30

        // The signed-in user info.
        const user = result.user;
        console.log("Google user:", user);
        
        const res = await fetch(`${process.env.SERVER_URI}api/users/register-google`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ uid: user.uid, email: user.email, username: defaultUsername }), // <--- include any extra data you want server-side
        });

        const data = await res.json();
        // Check if the response is successful
        if (!res.ok) {
            alert(data.message || "Failed to register user with Google.");
            return;
        } // end if
        
        // alert(data.message); // placeholder, replace with better UI feedback
        window.location.href = "http://${process.env.CLIENT_URI}/landing"

    } catch (error: any) {
        const errorCode = error.code;
        const errorMessage = error.message;
        // The email of the user's account used.
        const email = error.customData.email;
        // The AuthCredential type that was used.
        const credential = GoogleAuthProvider.credentialFromError(error);
        console.error("Error during Google sign-in:", errorCode, errorMessage, email, credential);
        alert("Error during Google sign-in: " + errorMessage);
    } // end try catch
} // end function registerWithGoogle


// TODO: implement function that hides email/password hints when input is satisfactory, highlight textbox green
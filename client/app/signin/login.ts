// Script for user login page
// import React, { useState } from "react";
import { signInWithEmailAndPassword, signInWithPopup, sendPasswordResetEmail } from "firebase/auth";
import { GoogleAuthProvider } from "firebase/auth";
import { auth, db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";
import { FirebaseError } from "firebase/app";

const provider = new GoogleAuthProvider();

// ---- User Login ---- //
export async function login(email: string, password: string) {

    try {
    // Sign in user with email and password
    await signInWithEmailAndPassword(auth, email, password);
    console.log("Logged in user:", auth.currentUser?.email);
    // router.push("/dashboard"); // Redirect to home page
    // return user;
    window.location.href = "https://circuitlink-160321257010.us-west2.run.app/landing"
    } catch (error) {
        if (error instanceof FirebaseError) {
            if (error.code === "auth/invalid-email" || 
                error.code === "auth/invalid-credential" || 
                error.code === "auth/user-not-found"
            ) {
                alert("Invalid email or password.");
            } else {
                alert("An unexpected error occurred: " + error.message);
            } // end if else
            console.error(error);
        } else {
            console.error("Unknown error: ", error);
            alert("An unexpected error occurred.");
        } // end if else
    } // end try catch
} // end function login

// ---- Login with Google ---- //
export async function loginWithGoogle() {
    try {
        const result = await signInWithPopup(auth, provider);
        // Check if account already exists
        const docSnap = await getDoc(doc(db, "Users", result.user.uid));

        if (docSnap.exists()) {
            console.log("Google user already exists in Firestore: ", result.user.email);
            window.location.href = "https://circuitlink-160321257010.us-west2.run.app/landing";   // TODO: Redirect to landing page
            return; // Account exists, no need to register
        } // end if

        // If account doesn't exist:
        // Generate a default username since Google sign-in doesn't provide one
        const now = new Date();
        const day = String(now.getDate()).padStart(2, '0');
        const hour = String(now.getHours()).padStart(2, '0');
        const minute = String(now.getMinutes()).padStart(2, '0');
        const defaultUsername = "User" + day + hour + minute;       // e.g., User231430 for 23rd at 14:30

        // The signed-in user info.
        const user = result.user;
        console.log("Google user:", user);

        // These weren't used
        // // This gives you a Google Access Token. You can use it to access the Google API.
        // const credential = GoogleAuthProvider.credentialFromResult(result);
        // The signed-in user info.
        // const token = credential?.accessToken;
        
        console.log("Google user:", user.email);
        const res = await fetch("https://api-circuit-link-160321257010.us-west2.run.app/api/users/register-google", {
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
        // window.location.href = "https://circuitlink-160321257010.us-west2.run.app/dashboard"
        window.location.href = "https://circuitlink-160321257010.us-west2.run.app/landing" // TODO: Redirect to landing page

        return user;
    } catch (error) {
        if (error instanceof FirebaseError) {
            const errorCode = error.code;
            const errorMessage = error.message;
            const email = (error.customData as { email?: string })?.email; // Email of the user's account used
            const credential = GoogleAuthProvider.credentialFromError(error); // AuthCredential type that was used
            
            console.error("Error during Google sign-in:", errorCode, errorMessage, email, credential);
            alert("Error during Google sign-in: " + errorMessage);
        } else {
            console.error("Unexpected error during Google sign-in:", error);
            alert("An unexpected error occurred during sign-in.");
        }
    } // end try catch
} // end loginWithGoogle

// Forgot password
export async function forgotPassword(email: string) {
    try {
        await sendPasswordResetEmail(auth, email);
        alert("Password reset link sent to " + email);  // TODO: Redirect to our own page and enforce password rules
    } catch (error) {
        if (error instanceof FirebaseError) {
            const errorCode = error.code;
            const errorMessage = error.message;
            console.error(errorCode, errorMessage);
        } else {
            console.error("Unexpected error during password reset: ", error);
        } // end if else 
    } // end try catch
} // end function forgotPassword
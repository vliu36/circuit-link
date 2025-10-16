// Script for user login page
import React, { useState } from "react";
import { signInWithEmailAndPassword, signInWithPopup, sendPasswordResetEmail } from "firebase/auth";
import { GoogleAuthProvider } from "firebase/auth";
import { auth, db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";

const provider = new GoogleAuthProvider();

// ---- User Login ---- //
export async function login(email: string, password: string) {

    try {
    // Sign in user with email and password
    await signInWithEmailAndPassword(auth, email, password);
    console.log("Logged in user:", auth.currentUser?.email);
    // router.push("/dashboard"); // Redirect to home page
    // return user;
    window.location.href = "http://localhost:3000/dashboard"
    } catch (err: any) {
        if (err.code === "auth/invalid-email" || err.code === "auth/invalid-credential" || err.code === "auth/user-not-found") {
            alert("Invalid email or password.");
        } else {
            alert("An unexpected error occurred.");
        } // end if else
        console.error(err);
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
            window.location.href = "http://localhost:3000/dashboard";   // TODO: Redirect to landing page
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
        // This gives you a Google Access Token. You can use it to access the Google API.
        const credential = GoogleAuthProvider.credentialFromResult(result);
        const token = credential?.accessToken;
        // The signed-in user info.
        
        console.log("Google user:", user.email);
        const res = await fetch("http://localhost:2400/api/users/register-google", {
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
        window.location.href = "http://localhost:3000/dashboard"
        window.location.href = "http://localhost:3000/dashboard" // TODO: Redirect to landing page

        return user;
    } catch (error: any) {
        const errorCode = error.code;
        const errorMessage = error.message;
        // const email = error.customData.email;
        // const credential = GoogleAuthProvider.credentialFromError(error);
        alert("Google sign-in failed: " + errorMessage);
        console.error("Error during Google sign-in:", errorCode, errorMessage);
    } // end try catch
}

// Forgot password
export async function forgotPassword(email: string) {
    try {
        await sendPasswordResetEmail(auth, email);
        alert("Password reset link sent to " + email);  // TODO: Redirect to our own page and enforce password rules
    } catch (error: any) {
        const errorCode = error.code;
        const errorMessage = error.message;
        console.error(errorCode, errorMessage);

    } // end try catch
} // end function forgotPassword
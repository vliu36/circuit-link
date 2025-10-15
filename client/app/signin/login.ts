// Script for user login page
import React, { useState } from "react";
import { signInWithEmailAndPassword, signInWithPopup, sendPasswordResetEmail } from "firebase/auth";
import { GoogleAuthProvider } from "firebase/auth";
import { auth } from "../firebase";

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
        // This gives you a Google Access Token. You can use it to access the Google API.
        const credential = GoogleAuthProvider.credentialFromResult(result);
        const token = credential?.accessToken;
        // The signed-in user info.
        const user = result.user;
        console.log("Google user:", user.email);

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
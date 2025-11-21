// Script for user login page
// import React, { useState } from "react";
import { signInWithEmailAndPassword, signInWithPopup, sendPasswordResetEmail } from "firebase/auth";
import { GoogleAuthProvider } from "firebase/auth";
import { auth, db } from "../_firebase/firebase";
import { doc, getDoc } from "firebase/firestore";
import { FirebaseError } from "firebase/app";

const provider = new GoogleAuthProvider();

// ---- User Login (revised) ---- //                                                     
export async function login(email: string, password: string) {
    try {
        // Sign in with Firebase Auth
        const userCredential = await signInWithEmailAndPassword(auth, email, password);

        const idToken = await userCredential.user.getIdToken();
        // Send the ID token to the server for verification
        const res = await fetch("https://api-circuit-link-160321257010.us-west2.run.app/api/users/login", {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json"},
            body: JSON.stringify({ idToken }),
        })

        if (!res.ok) {
            console.log("Login failed.");
            // alert("Login failed after registration.");
            return { status: "error", message: "Login failed after registration" };
        }

        console.log("")
        window.location.href = "https://circuitlink-160321257010.us-west2.run.app"
        return { status: "ok", message: "Login success."};
    } catch (error) {
        let msg: string;
        if (error instanceof FirebaseError) {
            if (error.code === "auth/invalid-email" || 
                error.code === "auth/invalid-credential" || 
                error.code === "auth/user-not-found"
            ) {
                alert("Invalid email or password.");
                msg = "Invalid email or password.";
            } else {
                alert("An unexpected error occurred: " + error.message);
                msg = "An unexpected error occurred: " + error.message;
            } // end if else
            console.error(error);
        } else {
            console.error("Unknown error: ", error);
            alert("An unexpected error occurred.");
            msg = "Unknown error: " + error;
        } // end if else
        return { status: "error", message: msg };
    } // end try catch
} // end function login

// ---- Login/Signup with Google (revised) ---- //
export async function loginWithGoogle() {
    try {
        const userCredential = await signInWithPopup(auth, provider);
        const user = userCredential.user;

        // Get Firebase ID token
        const idToken = await user.getIdToken();

        // Send to backend for verification/registration
        const res = await fetch("https://api-circuit-link-160321257010.us-west2.run.app/api/users/register-google", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ idToken, photoURL: user.photoURL }),
            credentials: "include"
        });

        const data = await res.json();
        if (!res.ok) {
            console.error("Google sign in failed:", data);

            // alert(data.message || "Failed to sign in user with Google.");
            return { status: "error", message: data.message || "Failed to sign in user with Google" };
        } // end if
        console.log("Google user signed in successfully:", data);
        window.location.href = "https://circuitlink-160321257010.us-west2.run.app"
        return { status: "ok", message: "Google login successful", user};
        
    } catch (error) {
        // console.error("Error during Google sign-in:", error.code, error.message);
        // alert("Google sign-in failed: " + error.message);
        if (error instanceof FirebaseError) {
            const errorCode = error.code;
            const errorMessage = error.message;
            const email = (error.customData as { email?: string })?.email; // Email of the user's account used
            const credential = GoogleAuthProvider.credentialFromError(error); // AuthCredential type that was used
            
            console.error("Error during Google sign-in:", errorCode, errorMessage, email, credential);
            // alert("Error during Google sign-in: " + errorMessage);
        } else {
            console.error("Unexpected error during Google sign-in:", error);
            // alert("An unexpected error occurred during sign-in.");
        }
        return { status: "error", message: "Google sign-in failed" };
    } // end try catch
} // end function loginWithGoogle

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
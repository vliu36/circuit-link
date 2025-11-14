// Script for user registration page

import { GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../_firebase/firebase";
import { doc, getDoc } from "firebase/firestore";
import { FirebaseError } from "firebase/app";
import "./register.module.css";

const provider = new GoogleAuthProvider();

// ---- User Registration + Login ---- //                                                    
export async function register(email: string, password: string, username: string) {
    // Register new user
    const res = await fetch("http://https://api-circuit-link-160321257010.us-west2.run.app/api/users/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, username }), // <--- include any extra data you want server-side
    });
    
    const data = await res.json();
    // Check if the response is successful
    if (!res.ok) {
        // alert(data.message || "Failed to register user.");
        return { message: data.message || "Failed to register user" };
    } // end if

    // Log in the user after successful registration
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    const idToken = await user.getIdToken();

    // Send token to backend to create session cookie
    const loginRes = await fetch("http://https://api-circuit-link-160321257010.us-west2.run.app/api/users/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
        credentials: "include"
    })

    if (!loginRes.ok) {
        console.log("Login failed after registration.");
        // alert("Login failed after registration.");
        return { message: "Login failed after registration" };
    }
    
    console.log("User registered and logged in successfully.")
    window.location.href = "http://https://circuitlink-160321257010.us-west2.run.app/landing"
    return { status: "ok", message:"User registered and logged in successfully", user};
} // end function register


// ---- Login/Signup with Google (revised) ---- //
export async function registerWithGoogle() {
    try {
        const userCredential = await signInWithPopup(auth, provider);
        const user = userCredential.user;

        // Get Firebase ID token
        const idToken = await user.getIdToken();

        // Send to backend for verification/registration
        const res = await fetch("http://https://api-circuit-link-160321257010.us-west2.run.app/api/users/register-google", {
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
        window.location.href = "http://https://circuitlink-160321257010.us-west2.run.app/landing"
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

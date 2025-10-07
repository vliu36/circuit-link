"use client";

import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import React, { useState } from "react";

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ This was used in local testing, will probably delete later ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ //
// const firebaseConfig = {
// apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
// authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
// projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
// storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
// messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
// appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
// measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
// };
const app = initializeApp();        // <-------- This would have 'firebaseConfig' in the parentheses during local testing.

// Creates a user in Firebase Authentication
export default function SignUp() {
    
    // Get the authentication instance from the Firebase app
    const auth = getAuth();         

    // Initialize state for the form fields (name, email, password)
    const [name, setName] = useState(""); 

    // The user's email address will be stored in this state variable
    const [email, setEmail] = useState(""); 

    // The user's password will be stored in this state variable
    const [password, setPassword] = useState("");

    // A message to display to the user (e.g. "Signup successful!" or "Error: ...")
    const [message, setMessage] = useState<string | null>(null);

    // Indicates whether the registration process is currently loading
    const [loading, setLoading] = useState(false);

    // Define a function to handle form submission and create a new user
    async function register(e: React.FormEvent<HTMLFormElement>) {
        // Prevent the default form submission behavior (i.e. don't reload the page)
        e.preventDefault();

        // Clear any existing error message
        setMessage(null);

        // Set loading state to true, indicating that the registration process is underway
        setLoading(true);

        try {
            // Call `createUserWithEmailAndPassword` to create a new user in Firebase Authentication
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);

            // Get the newly created user object from the `userCredential`
            const user = userCredential.user;

            // Important note: call the method (`getIdToken`) with parentheses to execute it
            const idToken = await user.getIdToken();

            // POST to your backend to create a profile, etc.
            // Use the `fetch` API to send a request to your server
            const res = await fetch("http://localhost:2400/api/users/register", {
                method: "POST",
                headers: {
                    // Specify the content type as JSON and include the ID token in the Authorization header
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${idToken}`
                },
                body: JSON.stringify({ email, password }), // <--- include any extra data you want server-side
            });

            // Check if the response was successful (200-299)
            if (!res.ok) {
                // If not, try to parse the error message from the response body
                const errorBody = await res.json().catch(() => ({}));
                throw new Error(errorBody.error || res.statusText || "Server error");
            } // end if

            // If the registration was successful, update the UI with a success message
            setMessage("Signup successful!");
            // Optionally clear the form fields and redirect to another page
            setEmail("");
            setPassword("");
        } catch (err) {
            // If an error occurred during registration, display an error message to the user
            setMessage("Signup failed.");
            console.error(err);
        } finally {
            // Regardless of whether an error occurred or not, set loading state to false
            setLoading(false);
        } // end try catch finally
    } // end function register

    // -------- HTML --------
    return (
    <div>
        <h1>Sign Up</h1>
        <form onSubmit={register}>
            <label>
                Email:
                <input 
                type="email" 
                name="email" 
                required
                onChange={(e) => setEmail(e.target.value)}/>
            </label>
            <br />
            <label>
                Password:
                <input 
                type="password" 
                name="password" 
                required
                onChange={(e) => setPassword(e.target.value)}/>
            </label>
            <br />
            <button type="submit">Sign Up</button>
        </form>
    </div>
    );
}

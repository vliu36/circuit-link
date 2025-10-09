"use client";

import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import React, { useState } from "react";

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ This was used in local testing, will probably delete later ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ //
//const firebaseConfig = {
    //apiKey: "AIzaSyAGALHo4fsqbqArtDzZg33983RT7DWOqfY",
    //authDomain: "circuit-link.firebaseapp.com",
    //projectId: "circuit-link",
    //storageBucket: "circuit-link.firebasestorage.app",
    //messagingSenderId: "160321257010",
    //appId: "1:160321257010:web:bfa9843152ab4e36c0862b",
    //measurementId: "G-1WGGFMJB05"
 //};

// const app = initializeApp(firebaseConfig);          // <-------- This is used in local testing, make sure to put credentials in firebaseConfig if you're local testing
//const app = initializeApp(firebaseConfig);                     

// Creates a user in Firebase Authentication
export default function SignUp() {
    
    // Get the authentication instance from the Firebase app
    //const auth = getAuth(app);         
    // Initialize state for the form fields (name, email, password)
    const [username, setName] = useState(""); 
    // The user's email address will be stored in this state variable
    const [email, setEmail] = useState(""); 
    // The user's password will be stored in this state variable
    const [password, setPassword] = useState("");
    // A message to display to the user (e.g. "Signup successful!" or "Error: ...")
    // const [message, setMessage] = useState<string | null>(null);
    // // Indicates whether the registration process is currently loading
    // const [loading, setLoading] = useState(false);

    // ---------------------------------------------------------------- BEGINNING OF USER REGISTRATION ---------------------------------------------------------------- //
    // Define a function to handle form submission and create a new user
    async function register(e: React.FormEvent<HTMLFormElement>) {
        // Prevent the default form submission behavior (i.e. don't reload the page)
        e.preventDefault();

        const res = await fetch("http://localhost:2400/api/users/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password, username }), // <--- include any extra data you want server-side
        });
        
        const data = await res.json();
        alert(data.message || "User created!");

    } // end function register
    // ---------------------------------------------------------------- END OF USER REGISTRATION ---------------------------------------------------------------- //

    // ---------------------------------------------------------------- BEGINNING OF USER LOGIN ---------------------------------------------------------------- //
    async function login(e: React.FormEvent<HTMLFormElement>) {
        // Prevent the default form submission behavior
        e.preventDefault();

        try {

            // Send credentials to backend endpoint
            const res = await fetch("http://localhost:2400/api/users/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }) 
            });

            // Await response from backend
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || "Login failed");
            }
            
            // Backend returns a Firebase ID token
            const { idToken } = data;

            // Store ID token in temporary session storage for the duration of the session
            sessionStorage.setItem("idToken", idToken);

            // Alert the user that they have successfully logged in
            alert(data.message || "Login success!");
            // TODO: Redirect to another page ------------------------------------------------------------------------------------------------[!] 
        } catch (err) {
            // setMessage("Login failed.");
            alert("Login failed.");
            console.log(err);
        } // end try catch 
    } // end function login
    // ---------------------------------------------------------------- END OF USER LOGIN ---------------------------------------------------------------- // 
    // ------------------------ HTML ------------------------
    return (
    <main background-color = "#322764">
        <div className = "box">
            <h1 className = "lblBox">Sign Up</h1>
            <form onSubmit={register}>
                {/* // TODO: Set username policy [i.e. char length, alphabet, spaces] - I'll leave this to frontend --------------------------------[!] */}
                <label className = "smallBox">
                    Username
                    <input
                    className = "txtBox" 
                    type="text" 
                    name="username"
                    required
                    onChange={(e) => setName(e.target.value)}/>
                </label>
                <br />
                <label className = "smallBox">
                    Email
                    <input 
                        className = "txtBox"
                        type="email" 
                        name="email" 
                        required
                            onChange={(e) => setEmail(e.target.value)}/>
                </label>
                <br />
                {/* // TODO: Set password policy - ditto ------------------------------------------------------------------------------------------------[!] */}
                <label className = "smallBox">
                    Password
                    <input 
                    className="txtBox"
                    type="password" 
                    name="password" 
                    required
                    onChange={(e) => setPassword(e.target.value)}/>
                </label>
                <br />
                <button className = "buttonBox" type="submit">[Sign Up]</button>
            </form>
        </div>
        <button className = "signUpWithGoogleButton">Sign up with Google</button>
        <a className="transparentButtonBox" href="../signin">Already have an account? Sign In</a>
        <br />
    </main>
    );
}



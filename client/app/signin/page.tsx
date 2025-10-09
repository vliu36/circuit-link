"use client";

import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import React, { useState } from "react";


// const app = initializeApp(firebaseConfig);          // <-------- This is used in local testing, make sure to put credentials in firebaseConfig if you're local testing
const app = initializeApp();                     

// Creates a user in Firebase Authentication
export default function SignUp() {
    
    // Get the authentication instance from the Firebase app
    //const auth = getAuth();         
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

    // ---------------------------------------------------------------- BEGINNING OF USER LOGIN ---------------------------------------------------------------- //
    async function login(e: React.FormEvent<HTMLFormElement>) {
        // Prevent the default form submission behavior
        e.preventDefault();

        // Initial message
        setMessage("Logging in...");
        const loginFail = "Login failed.";
        const loginSuccess = "Login successful!";
        // Set loading state to true while the user is being logged in
        setLoading(true);

        // Attempt to log in the user with the provided credentials
        try {
            // Attempt to log in the user with the provided credentials
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            const idToken = await userCredential.user.getIdToken();

            // Send idToken to backend for verification
            const res = await fetch("http://localhost:2400/api/users/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${idToken}`
                },
                body: JSON.stringify({ email }) // just in case we need it
            });

            // Check if the response is successful
            if (!res.ok) {
                setMessage(loginFail);
                alert(loginFail);
                const errorBody = await res.json().catch(() => ({}));
                throw new Error(errorBody.error || res.statusText || "Server error");
            } // end if

            // Alert user for successful login
            setMessage(loginSuccess);
            alert(loginSuccess);
            // TODO: Redirect to another page ------------------------------------------------------------------------------------------------[!] 
        } catch (err) {
            setMessage("Login failed.");
            alert(loginFail);
            console.log(err);
        } finally {
            setLoading(false);
        } // end try catch finally
    } // end function login
    // ---------------------------------------------------------------- END OF USER LOGIN ---------------------------------------------------------------- // 

    // ------------------------ HTML ------------------------
    return (
    <main>
        <div className = "box">
            <h1 className = "lblBox">Login</h1>
            <form onSubmit={login}>
                <label className = "smallBox">
                    Email:
                    <input 
                    className = "txtBox"
                    type="email" 
                    name="email"
                    required
                    onChange={(e) => setEmail(e.target.value)}/>
                </label>
                <br />
                <label className = "smallBox">
                    Password:
                    <input 
                    className = "txtBox"
                    type="password"
                    name="password"
                    required
                    onChange={(e) => setPassword(e.target.value)}/>
                </label>
                <br />
                <button type="submit" className = "buttonBox">[Login]</button>
            </form>
        </div>
        <button className = "signUpWithGoogleButton">Sign in with Google</button>
        <a className="transparentButtonBox2" href="../register">Don't have an account, sign up for FREE!</a>
    </main>
    );
}

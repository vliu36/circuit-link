"use client";

import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import React, { useState } from "react";

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ This was used in local testing, will probably delete later ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ //


// const app = initializeApp(firebaseConfig);          // <-------- This is used in local testing, make sure to put credentials in firebaseConfig if you're local testing
const app = initializeApp();                     

// Creates a user in Firebase Authentication
export default function SignUp() {
    
    // Get the authentication instance from the Firebase app
    const auth = getAuth(app);         
    // Initialize state for the form fields (name, email, password)
    const [username, setName] = useState(""); 
    // The user's email address will be stored in this state variable
    const [email, setEmail] = useState(""); 
    // The user's password will be stored in this state variable
    const [password, setPassword] = useState("");
    // A message to display to the user (e.g. "Signup successful!" or "Error: ...")
    const [message, setMessage] = useState<string | null>(null);
    // Indicates whether the registration process is currently loading
    const [loading, setLoading] = useState(false);

    // ---------------------------------------------------------------- BEGINNING OF USER REGISTRATION ---------------------------------------------------------------- //
    // Define a function to handle form submission and create a new user
    async function register(e: React.FormEvent<HTMLFormElement>) {
        // Prevent the default form submission behavior (i.e. don't reload the page)
        e.preventDefault();

        // Initial message
        setMessage("Signing up...");
        const regFail = "Sign Up Failed.";
        const regSuccess = "Sign Up Successful!"

        // Set loading state to true, indicating that the registration process is underway
        setLoading(true);

        try {
            // Call 'createUserWithEmailAndPassword' to create a new user in Firebase Authentication
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);

            // Get the newly created user object from the 'userCredential'
            const user = userCredential.user;

            // Important note: call the method ('getIdToken') with parentheses to execute it
            const idToken = await user.getIdToken();

            // POST to your backend to create a profile, etc.
            // Use the 'fetch' API to send a request to your server
            const res = await fetch("http://localhost:2400/api/users/register", {
                method: "POST",
                headers: {
                    // Specify the content type as JSON and include the ID token in the Authorization header
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${idToken}`
                },
                body: JSON.stringify({ email, password, username }), // <--- include any extra data you want server-side
            });

            // Check if the response was successful (200-299)
            if (!res.ok) {
                // If not, try to parse the error message from the response body
                setMessage(regFail);
                alert(regFail);
                const errorBody = await res.json().catch(() => ({}));
                throw new Error(errorBody.error || res.statusText || "Server error");
            } // end if

            // If the registration was successful, update the UI with a success message
            setMessage(regSuccess);
            // Alert user of successful signup
            alert(regSuccess);
            // Clear the form fields and redirect to another page
            setName("");
            setEmail("");
            setPassword("");
            // TODO: Redirect to another page ------------------------------------------------------------------------------------------------[!] 
        } catch (err) {
            // If an error occurred during registration, display an error message to the user
            setMessage(regFail);
            alert(message);
            console.error(err);
        } finally {
            // Regardless of whether an error occurred or not, set loading state to false
            setLoading(false);
        } // end try catch finally
    } // end function register
    // ---------------------------------------------------------------- END OF USER REGISTRATION ---------------------------------------------------------------- //

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
        <div>
            <h1>Login</h1>
            <form onSubmit={login}>
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
                <button type="submit">[Login]</button>
            </form>
            
        </div>
    </main>
    );
}


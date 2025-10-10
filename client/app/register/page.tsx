"use client";
import React, { useState } from "react";

// Creates a user in Firebase Authentication
export default function SignUp() {

    // Initialize state for the form fields (name, email, password)
    const [username, setName] = useState(""); 
    const [email, setEmail] = useState(""); 
    const [password, setPassword] = useState("");

    // ------ User Registration Start ------ //
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
    // ------ User Registration End ------ //

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



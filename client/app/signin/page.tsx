"use client";
import { useRouter } from "next/navigation";
import {login, loginWithGoogle} from "./login";
import React, { useState } from "react";

export default function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPass, setShowPass] = useState(false);
    const [error, setError] = useState("");

    // handleSubmit function for login
    async function handleSubmitLog(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        const cleanMail = email.trim();
        const cleanPass = password.trim();
        
        await login(cleanMail, cleanPass);
    } // end handleSubmitLog
    
    // ---- HTML ---- //
    return (
    <main>
        <div className = "box">
            <h1 className = "lblBox">Login</h1>
            <form onSubmit={handleSubmitLog}>
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
                    id = "password"
                    className = "txtBox"
                    type={showPass ? "text" : "password"}
                    name="password"
                    required
                    onChange={(e) => setPassword(e.target.value)}/>
                </label>
                <label className = "showPasswordBox"> {/* Checkbox to show/hide password */}
                    <input 
                    type="checkbox" 
                    checked={showPass}
                    onClick={() => setShowPass(!showPass)}/>
                    Show Password
                </label>
                <br />
                <button type="submit" className = "buttonBox">[Login]</button>
                <br />
                <br />
                {/* This displays an error message in the text if it occurs. */}
                {error && <p className ="errorMessage">{error}</p>}
            </form>
        </div>
        <button className = "signUpWithGoogleButton" onClick={loginWithGoogle}>Sign in with Google</button>
        <a className="transparentButtonBox2" href="../register">Don't have an account, sign up for FREE!</a>
    </main>
    );
}

"use client";
import React, { useState } from "react";
import {register, registerWithGoogle} from "./register";

export default function Registration() {

    const [username, setName] = useState(""); 
    const [email, setEmail] = useState(""); 
    const [password, setPassword] = useState("");
    
    const [showHintP, setShowHintP] = useState(false);
    const [showHintU, setShowHintU] = useState(false);
    const [showPass, setShowPass] = useState(false);
    const [loading, setLoading] = useState(false);

    if (loading) {
        return <p>Loading...</p>;
    }

    // handleSubmit function for registration
    async function handleSubmitReg(e: React.FormEvent<HTMLFormElement>) {
        const cleanMail = email.trim();
        const cleanPass = password.trim();
        e.preventDefault();
        await register(email, password, username);
    }

    return (
    <main background-color = "#394153">
        <div className = "box">
            <h1 className = "lblBox">Sign Up</h1>
            <form onSubmit={handleSubmitReg}>
                <label className = "smallBox">
                    Username
                    <input
                    className = "txtBox" 
                    type="text" 
                    name="username"
                    minLength={1}
                    maxLength={20}
                    pattern="^[a-zA-Z0-9_]+$"
                    required
                    onChange={(e) => setName(e.target.value)}
                    onFocus={() => setShowHintU(true)}/>
                </label>
                {showHintU && <p className="hint"><strong>Username can only contain letters, numbers, and underscores, and be within 1-20 characters.</strong></p>}
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
                <label className = "smallBox">
                    Password
                    <input 
                    id = "password"
                    className="txtBox"
                    type={showPass ? "text" : "password"}
                    name="password" 
                    minLength={8}
                    maxLength={20}
                    pattern="^(?!\s)(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\w\s]).{8,20}(?<!\s)$"
                    required
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setShowHintP(true)}/>
                </label>
                {showHintP && <p className="hint"><strong>8-20 chars, at least one uppercase, one lowercase, one number and one symbol. No leading or trailing spaces.</strong></p>}
                <label className = "showPasswordBox"> {/* Checkbox to show/hide password */}
                    <input 
                    type="checkbox" 
                    checked={showPass}
                    onChange={() => setShowPass(!showPass)}/>
                    Show Password
                </label>
                <br />
                <button className="buttonBox" type="submit">[Sign Up]</button>
            </form>
        </div>
        <button
        className = "signUpWithGoogleButton"
        onClick={registerWithGoogle}>Sign up with Google</button>
        <a className="transparentButtonBox" href="../signin">Already have an account? Sign In</a>
        <br />
    </main>
    );
}



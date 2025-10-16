"use client";
import { useRouter } from "next/navigation";
import {login, loginWithGoogle, forgotPassword} from "./login";
import React, { useState } from "react";
import "./login-styles.css";

export default function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPass, setShowPass] = useState(false);
    const [error, setError] = useState("");
    const [isOpen, setIsOpen] = useState(false);

    const togglePopup = () => {
        setIsOpen(!isOpen);
    }

    // handleSubmit function for login
    async function handleSubmitLog(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        const cleanMail = email.trim();
        const cleanPass = password.trim();
        
        await login(cleanMail, cleanPass);
    } // end handleSubmitLog
    
    // handleSubmit for forgot password
    async function handleSubmitForgotPassword(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        const cleanMail = email.trim();
        await forgotPassword(cleanMail);
    }

    // ---- HTML ---- //
    return (
    <main>
        <div className = "login-container">
            <h1 className = "label-box">Login</h1>
            <form onSubmit={handleSubmitLog}>
                <label className = "small-box">
                    Email:
                    <input 
                    className = "text-box"
                    type="email" 
                    name="email"
                    required
                    onChange={(e) => setEmail(e.target.value)}/>
                </label>
                <br />
                <label className = "small-box">
                    Password:
                    <input 
                    id = "password"
                    className = "text-box"
                    type={showPass ? "text" : "password"}
                    name="password"
                    required
                    onChange={(e) => setPassword(e.target.value)}/>
                </label>
                <label className = "show-password"> {/* Checkbox to show/hide password */}
                    <input 
                    type="checkbox" 
                    checked={showPass}
                    onChange={() => setShowPass(!showPass)}/>
                    Show Password
                </label>
                <br />
                <button type="submit" className = "button-box">[Login]</button>
                <br />
                <br />
                {/* This displays an error message in the text if it occurs. */}
                {error && <p className ="errorMessage">{error}</p>}
            </form>
        </div>
        <button className="forgot-password" onClick={togglePopup}>Forgot password?</button>

        {isOpen && (
        <div className="popup-overlay" onClick={togglePopup}>
            <div 
            className="popup-box"
            onClick={(e) => e.stopPropagation()}>
                <h2 className="popup-text">Reset Password</h2>
                <form onSubmit={handleSubmitForgotPassword}>
                    <input type="email" className="popup-text" placeholder="Enter your email" onChange={(e) => setEmail(e.target.value)} required/>
                    <button type="submit" className="popup-text">Send Reset Link</button>
                    <br />
                </form>
                <button className="close-button popup-text" onClick={togglePopup}>Close</button>
            </div>
        </div>
        )}
        <button className = "sign-with-google" onClick={loginWithGoogle}>Sign in with Google</button>
        <a className="transparent-button-box-2" href="../register">Don't have an account, sign up for FREE!</a>
    </main>
    );
}

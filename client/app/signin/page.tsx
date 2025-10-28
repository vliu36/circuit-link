"use client";
// import { useRouter } from "next/navigation";
import {login, loginWithGoogle, forgotPassword} from "./login";
import React, { useState } from "react";
import Styles from "./login-styles.css";

export default function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPass, setShowPass] = useState(false);
    // const [error, setError] = useState("");
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
        <div className={Styles.background}>
            <div className="loginContainer">
            <h1 className="title">Login</h1>
            <form onSubmit={handleSubmitLog}>
                <div className="emailBox">
                    <label>Email:</label>
                    <input
                    type="email"
                    name="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    />
                </div>

                <div className="passwordBox">
                    <label>Password:</label>
                    <input
                    type={showPass ? "text" : "password"}
                    name="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    />
                </div>

                <div className="showpasswordSection">
                    <label>
                        <input
                        type="checkbox"
                        checked={showPass}
                        onChange={() => setShowPass(!showPass)}
                        />
                        Show Password
                    </label>
                </div>

                <div className="loginButton">
                    <button type="submit">Login</button>
                </div>
            </form>

            <div className="forgotPasswordBox">
                <button type="button" onClick={togglePopup}>
                    Forgot Password?
                </button>
            </div>

            {isOpen && (
                <div className="popup-overlay" onClick={togglePopup}>
                    <div className="popup-box" onClick={(e) => e.stopPropagation()}>
                        <h2 className="popup-text">Reset Password</h2>
                        <form onSubmit={handleSubmitForgotPassword}>
                            <input
                            type="email"
                            className="popup-text"
                            placeholder="Enter your email"
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            />

                            <button type="submit" className="popup-text">
                                Send Reset Link
                            </button>
                        </form>

                        <button className="close-button popup-text" onClick={togglePopup}>
                            Close
                        </button>
                    </div>
                </div>
            )}

            <div className="googleButton">
                <button onClick={loginWithGoogle}>Log in with Google</button>
            </div>

            <div className="registerLink">
                <a href="/register"></a>
            </div>
        </div>
    </div> 
</main>)}
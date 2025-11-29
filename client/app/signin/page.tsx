"use client";
import { login, loginWithGoogle, forgotPassword } from "./login";
import React, { useState } from "react";
import Styles from "./login.module.css";
import Image from 'next/image';
import Link from 'next/link';
import googleIcon from '../../public/googleIcon.png';
import NavBar from "../_components/navbar/navbar.tsx";
import { block } from "sharp";

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
        <div>

            <main>

                <div className={Styles.background}>
                    <div>
                        <NavBar />
                    </div>
                    <div className={Styles.loginContainer}>

                        {/* Title */}
                        <h1 className={Styles.title}>Log in</h1>

                        {/* FORM */}
                        <form onSubmit={handleSubmitLog}>

                            {/* EMAIL */}
                            <div className={Styles.emailBox}>
                                <label>Email</label>
                                <input
                                    type="email"
                                    value={email}
                                    required
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>

                            {/* PASSWORD */}
                            <div className={Styles.passwordBox}>
                                <label>Password</label>
                                <input
                                    type={showPass ? "text" : "password"}
                                    value={password}
                                    required
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>

                            {/* Show password + forgot */}
                            <div className={Styles.showpasswordSection}>
                                <label>
                                    <input
                                        type="checkbox"
                                        checked={showPass}
                                        onChange={() => setShowPass(!showPass)}
                                    />
                                    Show password
                                </label>

                                <button
                                    type="button"
                                    className={Styles.forgotPasswordBtn}
                                    onClick={togglePopup}
                                >
                                    Forgot password?
                                </button>
                            </div>

                           
                            {/* Login button */}
                            <div className={Styles.centerButton}>
                                <button className={Styles.loginButton} type="submit">Log in</button>
                            </div>

                        </form>

                         

                        {/* Divider */}
                        <div className={Styles.lineBox}>
                            <span className={Styles.line}></span>
                            <span className={Styles.orText}>or</span>
                            <span className={Styles.line}></span>
                        </div>

                        {/* Google button */}
                        <button className={Styles.googleButton} onClick={loginWithGoogle}>
                            <Image
                                src="https://www.svgrepo.com/show/475656/google-color.svg"
                                width={30}
                                height={30}
                                alt="Google icon"
                                style={{ marginLeft:"12px" }}
                            />
                            <div
                                className={Styles.signUpWithGoogleText}
                            >
                                Log in with Google
                            </div>
                        </button>
                    </div>
                </div>


                {/* Moved this outside because overlay wasn't working properly; only darkened the background for the login box */}
                {/* This is a popup form that appears when the user clicks "Forgot Password?" */}
                {isOpen && (
                    <div className={Styles.popupOverlay} onClick={togglePopup}>
                        <div className={Styles.popupBox} onClick={(e) => e.stopPropagation()}>
                            <h2 className={Styles.popupText}>Reset Password</h2>
                            <form onSubmit={handleSubmitForgotPassword}>
                                <input
                                    type="email"
                                    className={Styles.popupText}
                                    placeholder="Enter your email"
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                                <button type="submit" className={Styles.popupText}>
                                    Send Reset Link
                                </button>
                            </form>

                            <button className={` ${Styles.closeBtn} ${Styles.popupText}`} onClick={togglePopup}>
                                Close
                            </button>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
} // end Login component
"use client";
import {login, loginWithGoogle, forgotPassword} from "./login";
import React, { useState } from "react";
import Styles from "./login.module.css";
import Image from 'next/image';
import Link from 'next/link';
import googleIcon from '../../public/googleIcon.png';

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
        <NavBar/>    
    <main>
        <div className={Styles.background}>
            <div className={Styles.loginContainer}>
            <h1 className={Styles.title}>Log in</h1>
            <form onSubmit={handleSubmitLog}>
                <div className={Styles.emailBox}>
                    <label>Email:</label>
                    <input
                    type="email"
                    name="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    />
                </div>

                <div className={Styles.passwordBox}>
                    <label>Password:</label>
                    <input
                    type={showPass ? "text" : "password"}
                    name="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    />
                </div>

                <div className={Styles.showpasswordSection}>
                    <label>
                        <input
                        type="checkbox"
                        checked={showPass}
                        onChange={() => setShowPass(!showPass)}
                        />
                        Show Password
                    </label>
                </div>

                <div className={Styles.forgotPasswordBox}>
                    <button type="button" onClick={togglePopup}>
                        Forgot Password?
                    </button>
                </div>

                <div className={Styles.loginButton}>
                    <button type="submit">Login</button>
                </div>
            </form>


            
            <div className = {Styles.lineBox}>
                <div className = {Styles.lefthorizontalLine}></div>
                <div className = {Styles.orBox}>or</div>
                <div className = {Styles.righthorizontalLine}></div>
            </div>
            <br/>
            <div className={Styles.googleButton}>
                <Image
                        src={googleIcon}
                        width={40}
                        height={40}
                        alt="Sign up with Google"
                        style={{marginLeft: '10px'}}
                ></Image>
                <button className = {Styles.signUpWithGoogleText} onClick={loginWithGoogle}>Sign in with Google</button>
            </div>

            <div className="registerLink">
                <Link href="./register" replace></Link>
            </div>
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
</main>)}
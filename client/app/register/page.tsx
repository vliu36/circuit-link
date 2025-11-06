"use client";
import React, { useState } from "react";
import {register, loginWithGoogle} from "./register";
import Styles from './register.module.css';
import Image from 'next/image';
import googleIcon from '../../public/googleIcon.png';
import Link from "next/link";

export default function Registration() {

    const [username, setName] = useState(""); 
    const [email, setEmail] = useState(""); 
    const [password, setPassword] = useState("");
    
    const [showHintP, setShowHintP] = useState(false);
    const [showHintU, setShowHintU] = useState(false);
    const [showPass, setShowPass] = useState(false);
    const [loading, setLoading] = useState(false);

    const router = useRouter();

    // handleSubmit function for registration
    async function handleSubmitReg(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await register(email.trim(), password.trim(), username);
            if (res?.status === "ok") {
                router.push("/landing");
            } else {
                console.log(res?.message);
            } // end if else
        } catch (err) {
            console.error("Unexpected error:", err);
        } finally {
            setLoading(false);
        } // end try finally
    } // end function handleSubmitReg

    // handleGoogleReg function for Google signup
    async function handleSubmitGoogle() {
        setLoading(true);
        try {
            const res = await loginWithGoogle();
            if (res.status === "ok") {
                router.push("/landing");
            } else {
                console.log(res.message);
            } // end if else
        } catch (err) {
            console.error("Unexpected error:", err);
        } finally {
            setLoading(false);
        } // end try catch finally
    } // end function handleSubmitGoogle

    if (loading) {
        return <div>Loading...</div>;
    }

    return (
    <div className = {Styles.background}>
        <div className = {Styles.box}>
            <h1 className = {Styles.lblBox}>Sign Up</h1>
            <form onSubmit={handleSubmitReg}>
                <label className = {Styles.smallBox}>
                    Username
                    <input
                    className = {Styles.txtBox} 
                    type="text" 
                    name="username"
                    minLength={1}
                    maxLength={20}
                    pattern="^[a-zA-Z0-9_]+$"
                    required
                    onChange={(e) => setName(e.target.value)}
                    onFocus={() => setShowHintU(true)}/>
                    {showHintU && <p className={Styles.hint}><strong>Username can only contain letters, numbers, and underscores, and be within 1-20 characters.</strong></p>}
                </label>
                <label className = {Styles.smallBox}>
                    Email
                    <input 
                    className = {Styles.txtBox}
                    type="email" 
                    name="email" 
                    required
                    onChange={(e) => setEmail(e.target.value)}/>
                    <p className={Styles.blankHint}>   </p>
                </label>
                <label className = {Styles.smallBox}>
                    Password
                    <input 
                    id = "password"
                    className={Styles.txtBox}
                    type={showPass ? "text" : "password"}
                    name="password" 
                    minLength={8}
                    maxLength={20}
                    pattern="^(?!\s)(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\w\s]).{8,20}(?<!\s)$"
                    required
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setShowHintP(true)}/>
                    {showHintP && <p className={Styles.hint}><strong>8-20 chars, at least one uppercase, one lowercase, one number and one symbol. No leading or trailing spaces.</strong></p>}
                </label>
                
                <div className = {Styles.checkBox}> {/* Checkbox to show/hide password */}
                    <input 
                    type="checkbox" 
                    checked={showPass}
                    onChange={() => setShowPass(!showPass)}/>
                    Show Password
                </div>

                <button className={Styles.buttonBox} type="submit">Sign Up</button>
                <div className = {Styles.lineBox}>
                    <div className = {Styles.lefthorizontalLine}></div>
                    <div className = {Styles.orBox}>OR</div>
                    <div className = {Styles.righthorizontalLine}></div>
                </div>
                <button
                    className = {Styles.signUpWithGoogleButton}
                    onClick={handleSubmitGoogle}>
                    <Image
                        src={googleIcon}
                        width={40}
                        height={40}
                        alt="Sign up with Google"
                    ></Image>
                    <h1 className = {Styles.signUpWithGoogleText}>Sign up with Google</h1>
                    </button>
            </form>
            
        </div>
        <Link className={Styles.transparentButtonBox} href="../signin">Already have an account? Sign In</Link>
    </div>
    );
}
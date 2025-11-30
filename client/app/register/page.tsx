"use client";
import React, { useState } from "react";
import { register, registerWithGoogle } from "./register";
import Styles from './register.module.css';
import Image from 'next/image';
import googleIcon from '../../public/googleIcon.png';
import NavBar from "../_components/navbar/navbar.tsx";
import { useRouter } from "next/navigation";

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
            if (res.status === "ok") {
                console.log("Registration successful:", res);
                router.push("/");
            }
        } finally {
            setLoading(false);
        } // end try finally
    } // end function handleSubmitReg

    // handleGoogleReg function for Google signup
    async function handleGoogleReg() {
        setLoading(true);
        try {
            const res = await registerWithGoogle();
            if (res.status === "ok") {
                console.log("Google Registration successful:", res);
                router.push("/");
            }
        } finally {
            setLoading(false);
        } // end try finally
    } // end function handleGoogleReg

    if (loading) {
        return <div>Loading...</div>;
    }

    return (
        <div className={Styles.background}>
            <NavBar />

            <div className={Styles.box}>
                {/* TITLE */}
                <h1 className={Styles.lblBox}>Sign up</h1>

                <form onSubmit={handleSubmitReg}>

                    {/* -------- USERNAME -------- */}
                    <div className={Styles.fieldGroup}>
                        <label className={Styles.label}>Username</label>
                        <input
                            className={Styles.txtBox}
                            type="text"
                            minLength={1}
                            maxLength={20}
                            pattern="^[a-zA-Z0-9_]+$"
                            required
                            onChange={(e) => setName(e.target.value)}
                            onFocus={() => setShowHintU(true)}
                        />
                        {showHintU && (
                            <p className={Styles.hint}>
                                Username can only contain letters, numbers, and underscores.
                            </p>
                        )}
                    </div>

                    {/* -------- EMAIL -------- */}
                    <div className={Styles.fieldGroup}>
                        <label className={Styles.label}>Email</label>
                        <input
                            className={Styles.txtBox}
                            type="email"
                            required
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>

                    {/* -------- PASSWORD -------- */}
                    <div className={Styles.fieldGroup}>
                        <label className={Styles.label}>Password</label>
                        <input
                            className={Styles.txtBox}
                            type={showPass ? "text" : "password"}
                            minLength={8}
                            maxLength={20}
                            pattern="^(?!\s)(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\w\s]).{8,20}(?<!\s)$"
                            required
                            onChange={(e) => setPassword(e.target.value)}
                            onFocus={() => setShowHintP(true)}
                        />
                        {showHintP && (
                            <p className={Styles.hint}>
                                8–20 characters, at least one uppercase, lowercase, number & symbol.
                            </p>
                        )}
                    </div>

                    {/* ---- SHOW PASSWORD ---- */}
                    <div className={Styles.showPasswordRow}>
                        <input
                            type="checkbox"
                            checked={showPass}
                            onChange={() => setShowPass(!showPass)}
                        />
                        <span>Show password</span>
                    </div>

                    {/* ---- SIGN UP BUTTON ---- */}
                    <div className={Styles.centerButton}>
                        <button className={Styles.buttonBox} type="submit">
                            Sign up
                        </button>
                    </div>

                    {/* ---- DIVIDER ---- */}
                    <div className={Styles.lineBox}>
                        <div className={Styles.line}></div>
                        <span className={Styles.orText}>or</span>
                        <div className={Styles.line}></div>
                    </div>

                    {/* ---- GOOGLE BUTTON ---- */}
                    <div className={Styles.googleButtonWrapper}>
                        <button className={Styles.signUpWithGoogleButton} onClick={handleGoogleReg}>
                            <Image
                                src={googleIcon}
                                width={30}
                                height={30}
                                alt="Google Icon"
                                style={{ marginLeft: "12px" }}
                            />
                            <span className={Styles.signUpWithGoogleText}>
                                Sign up with Google
                            </span>
                        </button>
                    </div>

                </form>
            </div>
        </div>
    );
}
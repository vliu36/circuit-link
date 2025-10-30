"use client";
import React from "react";
import Styles from "./bugreports.module.css";
import { useRouter } from "next/navigation";

export default function bugreports() {
    const router = useRouter();
    
    return (
        <div className = {Styles.background}>
            <div className = {Styles.pageDoc}>
                <br/>
                <h1 className = {Styles.heading1}>Report a Bug</h1>
                <div className = {Styles.responseBox}>
                    <h2 className = {Styles.heading2}>Select bug type: </h2>
                    <div className = {Styles.dropdownBar}></div>
                </div>
                <div className = {Styles.responseBox2}>
                    <h2 className = {Styles.heading2}>Type a description: </h2>
                    <input className = {Styles.responseBar} type="text" id="report message"></input>
                </div>

                <button className = {Styles.submitButton} onClick={() => router.push("/bugreportthankyou")}>
                    <h1 className = {Styles.submitButtonText}>Submit</h1>
                </button>
            </div> 

            <button className = {Styles.returnButton} onClick={() => router.push("/landing")}>
                    <h1 className = {Styles.returnButtonText}>Return</h1>
            </button>
        </div>
    );
}
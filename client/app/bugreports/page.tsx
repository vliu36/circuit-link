"use client";
import React from "react";
import Styles from "./bugreports.module.css";
import Link from "next/link";

export default function BugReports() {
    
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

                <Link className = {Styles.submitButton} href = "./bugreportthankyou" replace>
                    <h1 className = {Styles.submitButtonText}>Submit</h1>
                </Link>
            </div> 

            <Link className = {Styles.returnButton} href = "./landing" replace>
                    <h1 className = {Styles.returnButtonText}>Return</h1>
            </Link>
        </div>
    );
}
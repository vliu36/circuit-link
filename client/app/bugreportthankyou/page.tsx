"use client";
import React from "react";
import Styles from "./bugreports.module.css";
import Link from "next/link";

export default function BugReportThankYou() {

    
    return (
        <div className = {Styles.background}>
            <div className = {Styles.pageDoc}>
                <br/>
                <h1 className = {Styles.heading1}>Thank you for Reporting a bug</h1>
                <br/>
                <h2 className = {Styles.heading1}>
                    With your report, we can further improve Circuit Link&apos;s user experience. 
                    <br/>
                    <br/>
                    Press the return button, to return to the home page.
                </h2>
                <Link className = {Styles.returnButton} href = ".." replace>
                    <h1 className = {Styles.returnButtonText}>Return</h1>
                </Link>
            </div>
        </div>
    );
}
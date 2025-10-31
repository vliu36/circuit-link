"use client";
import React from "react";
import Styles from "./bugreports.module.css";
import { useRouter } from "next/navigation";

export default function BugReportThankYou() {
    const router = useRouter();
    
    return (
        <div className = {Styles.background}>
            <div className = {Styles.pageDoc}>
                <br/>
                <h1 className = {Styles.heading1}>Thank you for Reporting a bug</h1>
                <br/>
                <h2 className = {Styles.heading1}>
                    With your report, we can further improve Circuit Link's user experience. 
                    <br/>
                    <br/>
                    Press the return button, to return to the home page.
                </h2>
                <button className = {Styles.returnButton} onClick={() => router.push("/landing")}>
                    <h1 className = {Styles.returnButtonText}>Return</h1>
                </button>
            </div>
        </div>
    );
}
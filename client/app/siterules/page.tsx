"use client";
import React from "react";
import Styles from "./siterulse.module.css";
import { useRouter } from "next/navigation";

export default function SiteRules() {
    const router = useRouter();
    
    return (
        <div className = {Styles.background}>
            <button className = {Styles.returnButton} onClick={() => router.push("/landing")}>
                <h1 className = {Styles.returnButtonText}>Return</h1>
            </button>
            <div className = {Styles.rulesBox}>
                <div className = {Styles.titleBox}>
                    <h1 className={Styles.titleText}>Circuit Link Rules</h1>
                    <div className = {Styles.titleBoxLine}></div>
                </div>
                <div className = {Styles.innerBox}>
                    <p>This is a placeholder, rules will soon be made.</p>
                </div>
            </div>
        </div>
    );
}
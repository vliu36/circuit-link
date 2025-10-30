"use client";
import React from "react";
import Styles from "./help.module.css";
import { useRouter } from "next/navigation";

export default function help() {{/*function RulesPage*/}
    const router = useRouter();
    
    return (
        <div className = {Styles.background}>
            <button className = {Styles.returnButton} onClick={() => router.push("/landing")}>
                <h1 className = {Styles.returnButtonText}>Return</h1>
            </button>
            <div className = {Styles.mainBox}>
                <div className = {Styles.titleBox}>
                    <h1 className={Styles.titleText}>Help</h1>
                    <div className = {Styles.titleBoxLine}></div>
                </div>
                <div className = {Styles.innerBox}>
                    <p>Will implement a drop down feature.</p>
                </div>
            </div>
        </div>
    );
}
"use client";
import React from "react";
import Styles from "./help.module.css";
import Link from 'next/link';

export default function Help() {{/*function RulesPage*/}
    
    return (
        <div className = {Styles.background}>
            {/*Added https://circuitlink-160321257010.us-west2.run.app instead of ./landing since we got rid of it*/}
            <Link className = {Styles.returnButton} href = "https://circuitlink-160321257010.us-west2.run.app" replace>
                <h1 className = {Styles.returnButtonText}>Return</h1>
            </Link>
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
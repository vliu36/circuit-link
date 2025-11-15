"use client";
import React from "react";
import Styles from "./siterulse.module.css";
import Link from "next/link";
import NavBar from "../_components/navbar/navbar.tsx";

export default function SiteRules() {
    
    return (
        <div>
            <NavBar/>
        <div className = {Styles.background}>
            <Link className = {Styles.returnButton} href = "./landing" replace>
                <h1 className = {Styles.returnButtonText}>Return</h1>
            </Link>
            <div className = {Styles.rulesBox}>
                <div className = {Styles.titleBox}>
                    <h1 className={Styles.titleText}>Circuit Link Rules</h1>
                    <div className = {Styles.titleBoxLine}></div>
                </div>
                <div className = {Styles.innerBox}>
                    <p>0. Please be nice, don&apos;t be rude.
                    The first rule of Circuit Link is to never talk about Circuit Link.</p>
                </div>
            </div>
        </div>
        </div>
    );
}
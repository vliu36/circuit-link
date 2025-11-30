"use client";
import React from "react";
import Styles from "./siterulse.module.css";
import Link from "next/link";

export default function SiteRules() {
    
    return (
        <div className = {Styles.background}>
            <div className = {Styles.pageDoc}>
                <h1 className = {Styles.heading1}>Site Rules</h1>

                <section>
                    <p className = {Styles.paragraph}>
                    <strong>1.</strong> Do not post things you would not want other to see. You do you bro, its on you.
                    </p>
                    <p className = {Styles.paragraph}>
                    <strong>2.</strong> Be smart. Do not share personal information that you do not want floating around the internet.
                    </p>
                    <p className = {Styles.paragraph}>
                    <strong>3.</strong> Read the room. If you are having issues with people online...that you have no idea of...just walk away.
                    </p>
                    <p className = {Styles.paragraph}>
                    <strong>4.</strong> Be yourself and make sure to enjoy yourself.
                    </p>
                    <p className = {Styles.paragraph}>
                    <strong>5.</strong> In the event that you see something seriously wrong, please report it.
                    </p>
                    <p className = {Styles.paragraph}>
                    <strong>6.</strong> Have fun!
                    </p>
                </section>
                
                <Link className = {Styles.returnButton} href = ".." replace>
                    <span className = {Styles.returnButtonText}>Return</span>
                </Link>
            </div>
        </div>
    );
}
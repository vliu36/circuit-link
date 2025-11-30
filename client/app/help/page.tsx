"use client";
import React from "react";
import Styles from "./help.module.css";
import Link from "next/link";

export default function Help() {
    
    return (
        <div className = {Styles.background}>
            <div className = {Styles.pageDoc}>
                <h1 className = {Styles.heading1}>Help</h1>

                <section>
                    <p className = {Styles.paragraph}>
                    <strong>Landing Page</strong>: First page you see when logging in or upon registering. Is also the first before account creation.
                    </p>
                    <p className = {Styles.paragraph}>
                    <strong>Login Page</strong>: Page a user is taken to when trying to sign in with their created account.
                    </p>
                    <p className = {Styles.paragraph}>
                    <strong>Register Page</strong>: Page a user selects if they have yet to create their account. Cannot access full features without an account.
                    </p>
                    <p className = {Styles.paragraph}>
                    <strong>Communities</strong>: A hub-like place for people to join and dicuss or share things about topics they are passionate about or interested in.
                    </p>
                    <p className = {Styles.paragraph}>
                    <strong>Forums</strong>: Sub communities in which people can specify about certain things within their shared interests. Great way to get specific.
                    </p>
                    <p className = {Styles.paragraph}>
                    <strong>Moderator</strong>: A person who has special privilages in the community or forums. Can delete posts, replies, and even ban people when necessary.
                    </p>
                    <p className = {Styles.paragraph}>
                    <strong>Member</strong>: A person who is by all means regular in the sense that they do not have special privilages like moderators. Can post, reply, and like.
                    </p>
                    <p className = {Styles.paragraph}>
                    <strong>Friends</strong>: People who you send a friend request to and accept. Typically share similar interests and met in a community both are part of.
                    </p>
                    <p className = {Styles.paragraph}>
                    <strong>Yays</strong>: Yays are your traditional likes. Members of forums and communities can yay posts they like.
                    </p>
                    <p className = {Styles.paragraph}>
                    <strong>Nays</strong>: Nays are the polar opposite of Yays and behave like dislikes. Members can Nay posts that they dislike.
                    </p>
                </section>
                
                <Link className = {Styles.returnButton} href = ".." replace>
                    <span className = {Styles.returnButtonText}>Return</span>
                </Link>
            </div>
        </div>
    );
}
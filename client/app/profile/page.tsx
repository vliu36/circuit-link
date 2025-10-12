"use client";
import { auth, db } from "../firebase";
import React from "react";
import { User, onAuthStateChanged } from "firebase/auth";
import { deleteUserAccount, logout } from "./profile";
import { doc, getDoc } from "firebase/firestore";
import { useAuth } from "../context";


export default function Profile() {
    const { user, userData, loading } = useAuth();
    
    if (loading) {
        return <p>Loading user info...</p>;
    }
    // If no user is logged in, show message
    if (!user) {
        return ( <p>You must be logged in to view this page.</p> );
    }

    return (
        <main>
            <h1>Profile</h1>
            <p>Welcome to your profile page!</p>
            <button onClick={() => window.location.href = "http://localhost:3000/dashboard"}><u>&gt; Go to Dashboard</u></button>
            <br/>
            {/* Print user's username */}
            {/* List each user element */}
            <br/>
            <p>Username: {userData?.username}</p>
            <p>User: {user?.email}</p>
            <p>UID: {user?.uid}</p>
            <p>Email Verified: {user?.emailVerified ? "Yes" : "No"}</p>
            <p>Account Created: {user?.metadata.creationTime}</p>
            <p>Last Sign-in: {user?.metadata.lastSignInTime}</p>
            <br/>
            {/* Delete profile button */}
            <button onClick={() => { deleteUserAccount(); }}><u>&gt; Delete Profile</u></button>
            <br/>
            <br/>
            {/* Log out */}
            <button onClick={() => { logout(); }}><u>&gt; Log Out</u></button>
        </main>
);
}
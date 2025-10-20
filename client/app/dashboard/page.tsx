"use client";
import { auth } from "../firebase";
import React from "react";
import { User, onAuthStateChanged } from "firebase/auth";
import { useAuth } from "../context";

export default function Dashboard() {
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
        <h1>Dashboard</h1>
        <p>Welcome to your dashboard!</p>
        {/* Print user's username */}
        <p>User: {userData?.username}</p>
        <p>This place is just a placeholder.</p>
        {/* Redirect user to profile page */}
        <button onClick={() => window.location.href = `${process.env.CLIENT_URI}/profile`}><u>&gt; Go to Profile</u></button>
        </main>
    );
}
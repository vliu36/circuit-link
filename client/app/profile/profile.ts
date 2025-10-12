"use client";
import { auth } from "../firebase";
import React from "react";
import { User, onAuthStateChanged } from "firebase/auth";

// Delete user function
export async function deleteUserAccount() {
    const user = auth.currentUser;
    if (user) {
        try {
            const idToken = await user.getIdToken();
            // Delete user's document from Firestore first via backend
            const res = await fetch(`http://localhost:2400/api/users/delete/${user.uid}`, {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": "Bearer " + idToken
                },
                body: JSON.stringify({ uid: user.uid })
            });
            if (res.ok) {
                console.log("User document deleted from Firestore.");
                alert("User document deleted from Firestore.");
            } else {
                const data = await res.json();
                console.error("Error deleting user document:", data.message);
                alert("Error deleting user document: " + data.message);
                return;
            } // end if else

            // Now delete the user from Firebase Authentication
            await user.delete();
            alert("User account deleted successfully.");
            window.location.href = "http://localhost:3000/signin"; // Redirect to sign-in page
        } catch (error: any) {
            if (error.code === "auth/requires-recent-login") {
                alert("Please log in again to delete your account.");
                // Optionally, redirect to login page
                window.location.href = "http://localhost:3000/signin";
            } else {
                alert("Error deleting user: " + error.message);
            } // end if else
        } // end try catch
    } else {
        return alert("No user is currently signed in.");
    } // end if else
} // end function deleteUserAccount

// Log user out
export async function logout() {
    try {
        await auth.signOut();
        console.log("User signed out.");
        // Redirect to sign-in page after logout
        window.location.href = "http://localhost:3000/signin"
    } catch (err) {
        console.error("Error signing out:", err);
    } // end try catch
} // end function logout

// 
"use client";
import { auth, db, storage } from "../firebase";
import React from "react";
import { User, onAuthStateChanged, updateProfile, sendEmailVerification } from "firebase/auth";
import { doc, updateDoc, setDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

// Delete account (revised)
export async function deleteAccount() {
    const user = auth.currentUser;
    if (!user) return alert("Not signed in");

    try {
    const idToken = await user.getIdToken();

    // Call the backend endpoint
    const res = await fetch(`http://localhost:2400/api/users/delete-account`, {
        method: "DELETE",
        headers: {
            "Authorization": `Bearer ${idToken}`,
        },
    });

    if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to delete account.");
    }

    console.log("Account deleted successfully.");
    alert("Account deleted successfully."); // TODO: Make better UI response
    // window.location.href = "/landing"; // TODO: Route in a different function
    } catch (error: any) {
        console.log("Error deleting account: " + error.message)
        alert("Error deleting account: " + error.message);
    }
}

// Log user out
export async function logout() {
    try {
        await auth.signOut();
        console.log("User signed out.");
        // Clear the session cookie
        const res = await fetch("http://localhost:2400/api/users/logout", {
            method: "POST",
            credentials: "include",
        })
        const data = await res.json();
        console.log( data.message );

        window.location.href = "http://localhost:3000/signin"
    } catch (err) {
        console.error("Error signing out:", err);
    } // end try catch
} // end function logout

// Edit profile (no profile picture) revised
export async function editProfile(
    username: string,
    profileDesc: string,
    textSize: number,
    font: string,
    darkMode: boolean,
    privateMode: boolean,
    restrictedMode: boolean
) {
    const user = auth.currentUser;
    if (!user) {
        console.log("No user is currently signed in.");
        return;
    }

   // Get user document reference
    try {
        // Get Firebase ID token for authentication
        const idToken = await user.getIdToken();

        // Send update request to backend
        const res = await fetch("http://localhost:2400/api/users/edit-profile", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${idToken}`,
            },
            body: JSON.stringify({
                username,
                profileDesc,
                textSize,
                font,
                darkMode,
                privateMode,
                restrictedMode,
            }),
        });

        if (!res.ok) {
            const data = await res.json();
            throw new Error(data.message || "Failed to update profile.");
        }

        alert("Profile updated successfully.");
    } catch (error: any) {
        alert("Error updating profile: " + error.message);
    } // end try catch
}

// Update profile picture
export async function uploadProfilePicture(file: File) {
    // Validate user
    const user = auth.currentUser;
    if (!user) {
        console.log("No user is currently signed in.");
        return; 
    }
    const userRef = doc(db, "Users", user.uid);

    // Validate file type
    if (!file.type.startsWith("image/")) {
        throw new Error("Invalid file type. Only images are allowed");
    }
    // Validate file size
    const MAX_SIZE = 200 * 1024 // 200 KB <---------------------------------------------------- // TODO: Change file size later
    if (file.size > MAX_SIZE) {
        throw new Error("File too large. Maximum size is 200 KB.");
    }
    // Create unique file name
    const safeFileName = file.name.replace(/[^\w.-]/g,"_");
    const timestamp = Date.now();
    const fileRef = ref(storage, `"profile/"${user.uid}_${timestamp}_${safeFileName}`);
    try {
        const snapshot = await uploadBytes(fileRef, file);
        const downloadURL = await getDownloadURL(snapshot.ref);
        // Update photoURL in Auth
        await updateProfile(user, { photoURL: downloadURL });
        // Update photoURL in Firestore
        await updateDoc(userRef, { photoURL: downloadURL });
        console.log("Profile picture uploaded. URL:", downloadURL);
        return downloadURL;
    } catch (error) {
        console.error("Error uploading profile picture:", error);
        throw error;
    } // end try catch
} // end function uploadProfilePicture

// Live username check
export const basicUsernameCheck = (username: string) => {
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
        return "Username can only contain letters, numbers, and underscores.";
    }
    return ""; // No errors
} // end function basicUsernameCheck

// Verify email
export async function verifyEmail() {
    try {
        const user = auth.currentUser;
        if (!user) {
            console.log("No user is currently signed in.");
            return;
        }
        const emailVerification = await sendEmailVerification(user);
        alert("Email verification sent. Check your inbox.")
        console.log("Email verification sent. Check your inbox.");
    } catch (error) {
        console.error("Error verifying email:", error);
    } // end try catch
} // end function verifyEmail

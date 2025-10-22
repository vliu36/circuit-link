// Script for user login page
import { signInWithEmailAndPassword, signInWithPopup, sendPasswordResetEmail, fetchSignInMethodsForEmail, linkWithCredential } from "firebase/auth";
import { GoogleAuthProvider } from "firebase/auth";
import { auth } from "../firebase";

const provider = new GoogleAuthProvider();


// ---- User Login ---- //                                                     
export async function login(email: string, password: string) {
    try {
        // Sign in with Firebase Auth
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const idToken = await userCredential.user.getIdToken();
        // Send the ID token to the server for verification
        const res = await fetch("http://localhost:2400/api/users/login", {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json"},
            body: JSON.stringify({ idToken }),
        })
        console.log("")
        return res;
    } catch (error: any) {

        console.error("Login failed:", error);
        return { ok: false };
    } // end try catch
} // end function login


// ---- Login/Signup with Google (revised) ---- //
export async function loginWithGoogle() {
    try {
        const userCredential = await signInWithPopup(auth, provider);
        const user = userCredential.user;

        // Get Firebase ID token
        const idToken = await user.getIdToken();

        // Send to backend for verification/registration
        const res = await fetch("http://localhost:2400/api/users/register-google", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ idToken, photoURL: user.photoURL }),
            credentials: "include"
        });

        const data = await res.json();
        if (!res.ok) {
            console.error("Google sign in failed:", data);

            alert(data.message || "Failed to sign in user with Google.");
            return;
        } // end if
        console.log("Google user signed in successfully:", data);
        return user;
    } catch (error: any) {
        console.error("Error during Google sign-in:", error.code, error.message);
        alert("Google sign-in failed: " + error.message);
    } // end try catch
} // end function loginWithGoogle

// Forgot password
export async function forgotPassword(email: string) {
    try {
        await sendPasswordResetEmail(auth, email);
        alert("Password reset link sent to " + email);  
    } catch (error: any) {
        const errorCode = error.code;
        const errorMessage = error.message;
        console.error(errorCode, errorMessage);

    } // end try catch
} // end function forgotPassword
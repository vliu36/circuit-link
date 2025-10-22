import { GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";
import "./register-styles.css";

const provider = new GoogleAuthProvider();

// ---- User Registration + Login ---- //                                                    
export async function register(email: string, password: string, username: string) {

    const res = await fetch("http://localhost:2400/api/users/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, username }), // <--- include any extra data you want server-side
    });
    
    const data = await res.json();
    // Check if the response is successful
    if (!res.ok) {
        alert(data.message || "Failed to register user.");
        return;
    } // end if

    // Log in the user after successful registration
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    const idToken = await user.getIdToken();

    // Send token to backend to create session cookie
    const loginRes = await fetch("http://localhost:2400/api/users/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
        credentials: "include"
    })

    if (!loginRes.ok) {
        console.log("Login failed after registration.");
        alert("Login failed after registration.");
        return;
    }
    
    console.log("User registered successfully.")
    return user;
} // end function register

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


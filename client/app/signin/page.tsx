"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { initializeApp } from "firebase/app";

// TODO: Move this to a separate file. ---------------------------------------------------------------------------------------[!]
const app = initializeApp({ apiKey: "AIzaSyD3VCMA1MxjtLzXjkEFXr-XEPpkyftPSTo" });


// Creates a user in Firebase Authentication
export default function SignUp() {
    
    // Initialize state for the form fields (name, email, password)
    const [username, setName] = useState(""); 
    const [email, setEmail] = useState(""); 
    const [password, setPassword] = useState("");

// ----- User Login Start ------ //
    async function login(e: React.FormEvent<HTMLFormElement>) {
        // Prevent the default form submission behavior
        e.preventDefault();

        try {
            
            const auth = getAuth(app);

            const userCredentials = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredentials.user;
            console.log("Signed in as:", user.email);
            alert(`Welcome, ${user.email}`);
            
            window.location.href = "https://circuitlink-160321257010.us-west2.run.app"
            // TODO: Redirect to another page ------------------------------------------------------------------------------------------------[!]
        } catch (err) {
            // setMessage("Login failed.");
            alert("Login failed: " + err);
            console.log(err);
        } // end try catch 
    } // end function login
    // ------ User Login End ------ // 

    // ------ HTML ------ //
    return (
    <main>
        <div className = "box">
            <h1 className = "lblBox">Login</h1>
            <form onSubmit={login}>
                <label className = "smallBox">
                    Email:
                    <input 
                    className = "txtBox"
                    type="email" 
                    name="email"
                    required
                    onChange={(e) => setEmail(e.target.value)}/>
                </label>
                <br />
                <label className = "smallBox">
                    Password:
                    <input 
                    className = "txtBox"
                    type="password"
                    name="password"
                    required
                    onChange={(e) => setPassword(e.target.value)}/>
                </label>
                <br />
                <button type="submit" className = "buttonBox">[Login]</button>
            </form>
        </div>
        <button className = "signUpWithGoogleButton">Sign in with Google</button>
        <a className="transparentButtonBox2" href="../register">Don't have an account, sign up for FREE!</a>
    </main>
    );
}

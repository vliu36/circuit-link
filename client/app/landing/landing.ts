import { auth } from "../firebase";

// Log user out
export async function logout() {
    try {
        await auth.signOut();
        console.log("User signed out.");
        // Redirect to sign-in page after logout
        
        // Clear the session cookie
        const res = await fetch("http://localhost:2400/api/users/logout", {
            method: "POST",
            credentials: "include",
        })
        const data = await res.json();
        console.log( data.message );

        window.location.href = "http://${process.env.CLIENT_URI}/signin"
    } catch (err) {
        console.error("Error signing out:", err);
    } // end try catch
} // end function logout
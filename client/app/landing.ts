import { auth } from "./_firebase/firebase";

// Log user out (revised)
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

        window.location.href = "http://localhost:3000/"
        return { status: "ok", message: "User signed out successfully", };
    } catch (err) {
        console.error("Error signing out:", err);
        return { status: "error", message: "An error occurred while signing out.", };
    } // end try catch
} // end function logout
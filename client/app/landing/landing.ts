import { auth } from "../firebase";

// Log user out
export async function logout() {
    try {
        await auth.signOut();
        console.log("User signed out.");
        // Redirect to sign-in page after logout
        window.location.href = `${process.env.CLIENT_URI}/signin`
    } catch (err) {
        console.error("Error signing out:", err);
    } // end try catch
} // end function logout
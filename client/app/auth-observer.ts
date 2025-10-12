// This is to observe auth state changes (login/logout) across the app
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebase";

// Initialize the auth state observer
export function initAuthListener(): void {
    onAuthStateChanged(auth, (user) => {
        if (user) {
            
            const uid = user.uid;
            console.log("User is signed in with UID:", uid);

        } else {
            // User is signed out
            console.log("No user signed in.");

        } // end if else
    });
} // end function initAuthListener
import { auth, db, storage } from "../firebase";
import { updateProfile, sendEmailVerification } from "firebase/auth";
import { doc, updateDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

// Interface for updatedData in function editProfile
interface updatedData {
    username?: string;
    profileDesc?: string;
    textSize?: number;
    font?: string;
    darkMode?: boolean;
    privateMode?: boolean;
    restrictedMode?: boolean;
}

// Delete user 
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
                //alert("User document deleted from Firestore.");
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
        } catch (error) {
            if (error instanceof Error) {
                const firebaseAuthError = error as { code?: string; message: string};
                if (firebaseAuthError.code === "auth/requires-recent-login") {
                    alert("Please log in again to delete your account."); 
                    window.location.href = "http://localhost:3000/signin";
                } else {
                    alert("Error deleting user: " + firebaseAuthError.message);
                } // end if else
            } else {
                alert("An unknown error occurred while deleting your account.");
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

// Edit profile - note this does not include profile picture update
export async function editProfile(username: string, profileDesc: string, textSize: number, font: string, darkMode: boolean, privateMode: boolean, restrictedMode: boolean) {
    const user = auth.currentUser;
    if (user) {
        try {
            // Update Firebase Authentication profile
            await updateProfile(user, {
                displayName: username || user.displayName,
            });
            // Update Firestore document with new profile data
            const userDocRef = doc(db, "Users", user.uid);
            const updatedData: Partial<updatedData> = {};
            if (username) updatedData.username = username;
            if (profileDesc) updatedData.profileDesc = profileDesc;
            if (textSize) updatedData.textSize = textSize;
            if (font) updatedData.font = font;
            updatedData.darkMode = darkMode;
            updatedData.privateMode = privateMode;
            updatedData.restrictedMode = restrictedMode;
            await updateDoc(userDocRef, updatedData);
            alert("Profile updated successfully.");
        } catch (error) {
            if (error instanceof Error) {
                alert("Error updating profile: " + error.message);
            } else {
                alert("An unknown error occurred.");
            } // end if else
        } // end try catch
    } else {
        console.error("User not logged in");
        alert("No user is currently signed in.");
    } // end if else
} // end function editProfile

// Update profile picture
export async function uploadProfilePicture(file: File, path: string) {
    try {
        // Create storage reference for the file
        const fileRef = ref(storage, `${path}${file.name}`);
        const snapshot = await uploadBytes(fileRef, file);
        const downloadURL = await getDownloadURL(snapshot.ref);
        console.log("Profile picture uploaded. URL:", downloadURL);
        await updateProfile(auth.currentUser!, { photoURL: downloadURL });
        // return downloadURL;
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
            console.log("No user detected.");
            return;
        }
        await sendEmailVerification(user);
        alert("Email verification sent. Check your inbox.")
        console.log("Email verification sent. Check your inbox.");
    } catch (error) {
        console.error("Error verifying email:", error);
    } // end try catch
} // end function verifyEmail

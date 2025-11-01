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
    // alert("Account deleted successfully."); 
    window.location.href = "/";
    } catch (error: any) {
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
} // end deleteAccount

// // Delete user 
// export async function deleteUserAccount() {
//     const user = auth.currentUser;
//     if (user) {
//         try {
//             const idToken = await user.getIdToken();
//             // Delete user's document from Firestore first via backend
//             const res = await fetch(`http://localhost:2400/api/users/delete/${user.uid}`, {
//                 method: "DELETE",
//                 headers: {
//                     "Content-Type": "application/json",
//                     "Authorization": "Bearer " + idToken
//                 },
//                 body: JSON.stringify({ uid: user.uid })
//             });
//             if (res.ok) {
//                 console.log("User document deleted from Firestore.");
//                 //alert("User document deleted from Firestore.");
//             } else {
//                 const data = await res.json();
//                 console.error("Error deleting user document:", data.message);
//                 alert("Error deleting user document: " + data.message);
//                 return;
//             } // end if else

//             // Now delete the user from Firebase Authentication
//             await user.delete();
//             alert("User account deleted successfully.");
//             window.location.href = "http://localhost:3000/signin"; // Redirect to sign-in page
//         } catch (error) {
//             if (error instanceof Error) {
//                 const firebaseAuthError = error as { code?: string; message: string};
//                 if (firebaseAuthError.code === "auth/requires-recent-login") {
//                     alert("Please log in again to delete your account."); 
//                     window.location.href = "http://localhost:3000/signin";
//                 } else {
//                     alert("Error deleting user: " + firebaseAuthError.message);
//                 } // end if else
//             } else {
//                 alert("An unknown error occurred while deleting your account.");
//             } // end if else
//         } // end try catch
//     } else {
//         return alert("No user is currently signed in.");
//     } // end if else
// } // end function deleteUserAccount

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
    } // end try catch
} // end function logout

// // Log user out
// export async function logout() {
//     try {
//         await auth.signOut();
//         console.log("User signed out.");
//         // Redirect to sign-in page after logout
//         window.location.href = "http://localhost:3000/signin"
//     } catch (err) {
//         console.error("Error signing out:", err);
//     } // end try catch
// } // end function logout

// Edit profile (no profile picture) (revised)
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
} // end editProfile

// // Edit profile - note this does not include profile picture update
// export async function editProfile(username: string, profileDesc: string, textSize: number, font: string, darkMode: boolean, privateMode: boolean, restrictedMode: boolean) {
//     const user = auth.currentUser;
//     if (user) {
//         try {
//             // Update Firebase Authentication profile
//             await updateProfile(user, {
//                 displayName: username || user.displayName,
//             });
//             // Update Firestore document with new profile data
//             const userDocRef = doc(db, "Users", user.uid);
//             const updatedData: Partial<updatedData> = {};
//             if (username) updatedData.username = username;
//             if (profileDesc) updatedData.profileDesc = profileDesc;
//             if (textSize) updatedData.textSize = textSize;
//             if (font) updatedData.font = font;
//             updatedData.darkMode = darkMode;
//             updatedData.privateMode = privateMode;
//             updatedData.restrictedMode = restrictedMode;
//             await updateDoc(userDocRef, updatedData);
//             alert("Profile updated successfully.");
//         } catch (error) {
//             if (error instanceof Error) {
//                 alert("Error updating profile: " + error.message);
//             } else {
//                 alert("An unknown error occurred.");
//             } // end if else
//         } // end try catch
//     } else {
//         console.error("User not logged in");
//         alert("No user is currently signed in.");
//     } // end if else
// } // end function editProfile


// TODO: Update this to be handled by the server
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

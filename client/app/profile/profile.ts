import { auth, db, storage, app, functions } from "../_firebase/firebase";
import { updateProfile, sendEmailVerification } from "firebase/auth";
import { doc, DocumentReference, getDoc, updateDoc } from "firebase/firestore";
// import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
// import { getFunctions, httpsCallable } from "firebase/functions";
import { uploadImage } from "../_utils/mediaUpload";

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

// Interface used for getFriends function
export interface User {
    id: string;
    username: string;
    email: string;
    photoURL: string;
    createdAt: Date;
    friendList: DocumentReference[];
    notifications: DocumentReference[];
    profileDesc?: string;
}

// Delete account (revised)
export async function deleteUserAccount() {
    const user = auth.currentUser;
    if (!user) return {
        status: "error",
        message: "No user is currently signed in.",
    };

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
        // window.location.href = "/";
        return { status: "ok", message: "Account deleted successfully." };
    } catch (error) {
        let msg: string;
        if (error instanceof Error) {
            const firebaseAuthError = error as { code?: string; message: string};
            if (firebaseAuthError.code === "auth/requires-recent-login") {
                console.log(`${firebaseAuthError.message}`);
                return { status: "error", message: "Please log in again to delete your account." };
            } else {
                console.log(`Error deleting user: ${firebaseAuthError.message}`);
                return { status: "error", message: firebaseAuthError.message };
            } // end if else
        } else {
            console.log("An unknown error occurred while deleting your account.");
        } // end if else
        return { status: "error", message: "An unknown error occurred while deleting your account." };
    } // end try catch
} // end deleteAccount

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
        console.warn("Error signing out:", err);
        return { status: "error", message: "An error occurred while signing out.", };
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
            console.log("Profile updated successfully.");
            return { status: "ok", message: "Profile updated successfully." };
        } catch (error) {
            if (error instanceof Error) {
                console.log("Error updating profile:", error.message);
                return { status: "error", message: error.message };
            } else {
                console.log("An unknown error occurred while updating profile.");
                return { status: "error", message: "An unknown error occurred while updating profile." };
            } // end if else
        } // end try catch
    } else {
        console.log("User not logged in");
        return { status: "error", message: "User not logged in." };
    } // end if else
} // end function editProfile

// Update profile picture
export async function uploadProfilePicture(file: File) {
    try {
        // Upload image using updated storage handler
        const fileName = await uploadImage(file);
        if (!fileName) {
            throw new Error("Image upload failed — no filename returned.");
        }

        // Storage folder for images
        const finalPublicPath = `images/${fileName}`;
        const publicUrl = `https://storage.googleapis.com/circuit-link.firebasestorage.app/${finalPublicPath}`;

        // Update Firebase Auth profile
        await updateProfile(auth.currentUser!, { photoURL: publicUrl });

        // Update Firestore user document
        const userDocRef = doc(db, "Users", auth.currentUser!.uid);
        await updateDoc(userDocRef, { photoURL: publicUrl });

        console.log("Profile picture uploaded. URL:", publicUrl);
        return publicUrl;

    } catch (error) {
        console.warn("Error uploading profile picture:", error);
        return null;
    }
}

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
            return { status: "error", message: "No user detected." };
        }
        await sendEmailVerification(user);
        console.log("Email verification sent. Check your inbox.");
        return { status: "ok", message: "Email verification sent. Check your inbox." };
    } catch (error) {
        console.log("Error verifying email:", error);
        return { status: "error", message: "Error sending email verification." };
    } // end try catch
} // end function verifyEmail

// Convert array of DocumentReferences to array of User objects
export async function getFriends(friendRefs: DocumentReference[]): Promise<User[]> {
    if (!friendRefs || friendRefs.length === 0) return [];

    try {
        // Fetch all friend documents in parallel
        const friendDocs = await Promise.all(
            friendRefs.map(async (ref) => {
            const docSnap = await getDoc(ref);
            if (docSnap.exists()) {
                return { id: docSnap.id, ...docSnap.data() } as User;
            }
            return null;
            })
        );

        // Filter out any missing/null results
        return friendDocs.filter((f): f is User => f !== null);
    } catch (error) {
        console.warn("Error fetching friends:", error);
        return [];
    } // end try catch
} // end function getFriends

// Remove friend
export async function removeFriend(friendId: string) {
    try {
        const idToken = await auth.currentUser?.getIdToken();
        if (!idToken) {
            throw new Error("User not authenticated");
        }
        const removed = await fetch(`http://localhost:2400/api/users/remove-friend`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${idToken}`,
            },
            body: JSON.stringify({ friendId }),
        });
        if (!removed.ok) {
            throw new Error("Failed to remove friend");
        }
        console.log("Friend removed successfully.");
        return { status: "ok", message: "Friend removed successfully." };
    } catch (error) {
        console.warn("Error removing friend:", error);
        return { status: "error", message: "Error removing friend." };
    } // end try catch
}
import { auth, db, storage } from "../_firebase/firebase";
import { updateProfile, sendEmailVerification } from "firebase/auth";
import { arrayRemove, doc, DocumentReference, getDoc, updateDoc } from "firebase/firestore";
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
export async function uploadProfilePicture(file: File) {
    try {
        // Create storage reference for the file
        const fileRef = ref(storage, `profiles/${file.name}`);
        const snapshot = await uploadBytes(fileRef, file);
        const downloadURL = await getDownloadURL(snapshot.ref);
        console.log("Profile picture uploaded. URL:", downloadURL);

        // Update user's profile in auth
        await updateProfile(auth.currentUser!, { photoURL: downloadURL });

        // Update user's document in Firestore
        const userDocRef = doc(db, "Users", auth.currentUser!.uid);
        await updateDoc(userDocRef, { photoURL: downloadURL });
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
        console.error("Error fetching friends:", error);
        throw error;
    } // end try catch
} // end function getFriends

// Remove friend
export async function removeFriend(friendId: string, userId: string) {
    try {
        const removed = await fetch(`http://localhost:2400/api/users/remove-friend`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ friendId, userId }),
        });
        if (!removed.ok) {
            throw new Error("Failed to remove friend");
        }
        console.log("Friend removed successfully.");
    } catch (error) {
        console.error("Error removing friend:", error);
    } // end try catch
}
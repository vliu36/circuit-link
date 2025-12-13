import { auth, db, storage, app, functions } from "./_firebase/firebase";
import { updateProfile, sendEmailVerification } from "firebase/auth";
import { doc, DocumentReference, getDoc, updateDoc } from "firebase/firestore";
// import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { getFunctions, httpsCallable } from "firebase/functions";
import { uploadImage } from "./_utils/mediaUpload";

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

export interface Community {
    id: string;
    name: string;
    icon?: string;
    numUsers?: number;
    yayScore?: number;
    description?: string;
}

// Log user out (revised)
export async function logout() {
    try {
        await auth.signOut();
        console.log("User signed out.");
        // Clear the session cookie
        const res = await fetch("https://api-circuit-link-160321257010.us-west2.run.app/api/users/logout", {
            method: "POST",
            credentials: "include",
        })
        const data = await res.json();
        console.log( data.message );

        window.location.href = "https://circuitlink-160321257010.us-west2.run.app/"
        return { status: "ok", message: "User signed out successfully", };
    } catch (err) {
        console.error("Error signing out:", err);
        return { status: "error", message: "An error occurred while signing out.", };
    } // end try catch
} // end function logout

/** Retrieve the top 10 communities by yay score
 *  @returns Array of top communities sorted by yay score, or an error
 *      id: string
 *      name: string
 *      icon: string (photo url)
 *      numUsers: number
 *      yayScore: number
 */
export async function fetchTopCommunities() {
    try {
        const response = await fetch("https://api-circuit-link-160321257010.us-west2.run.app/api/comm/top");
        const data = await response.json();
        if (response.ok) {
            return data; // Return array of top communities
        } else {
            throw new Error(data.message || "Failed to fetch top communities");
        }
    } catch (err) {
        console.error("Error fetching top communities:", err);
        return [];
    }
}

/** Retrieve the top 10 users by yay score
 *  @returns Array of top users sorted by yay score, or an error
 *      id: string
 *      username: string
 *      photoURL: string
 *      yayScore: number
 */
export async function fetchTopUsers() {
    try {
        const response = await fetch("https://api-circuit-link-160321257010.us-west2.run.app/api/users/top");
        const data = await response.json();
        if (response.ok) {
            return data; // Return array of top users
        } else {
            throw new Error(data.message || "Failed to fetch top users");
        }
    } catch (err) {
        console.error("Error fetching top users:", err);
        return [];
    }
}

export async function getCommunities(joinedComms: DocumentReference[]): Promise<Community[]> {
    if (!joinedComms || joinedComms.length === 0) return [];

    try {
        const commDocs = await Promise.all(
            joinedComms.map(async (ref) => {
                const snap = await getDoc(ref);
                if (snap.exists()) {
                    return { id: snap.id, ...snap.data() } as Community;
                }
                return null;
            })
        );

        return commDocs.filter((c): c is Community => c !== null);
    } catch (error) {
        console.error("Error fetching communities:", error);
        throw error;
    }
}
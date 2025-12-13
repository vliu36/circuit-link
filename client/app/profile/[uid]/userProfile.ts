// Functions for viewing other user's profile

const BASE_URL = "https://api-circuit-link-160321257010.us-west2.run.app/api/users";

export interface OtherUserData {
    user: {
        uid: string;
        username: string;
        email: string;
        photoURL: string;
        createdAt: Date;
        profileDesc?: string;
    }
}

// Fetch user data by UID
export async function fetchUserById(uid: string) {
    try {
        const response = await fetch(`${BASE_URL}/get/${uid}`);
        if (!response.ok) {
            // throw new Error("Failed to fetch user data");
            console.warn("Failed to fetch user data");
            return null; // User not found
        }
        const userData = await response.json();
        console.log("Fetched user data:", userData);
        return userData;
    } catch (error) {
        console.error("Error fetching user by ID:", error);
        throw error;
    } // end try catch
} // end function fetchUserById

// Send friend request
export async function sendFriendRequest(senderId: string, recipientId: string) {
    try {
        const response = await fetch(`${BASE_URL}/friend-request`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ senderId, recipientId }),
        });
        if (!response.ok) {
            const errorData = await response.json();
            console.error("Error sending friend request:", errorData.message);
            alert(`Error: ${errorData.message}`);
            return;
        }
        alert("Friend request sent successfully.");
    } catch (error) {
        console.error("Error sending friend request:", error);
    } // end try catch
} // end function sendFriendRequest

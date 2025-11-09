// Functions for managing user notifications

import { db } from "../../../app/_firebase/firebase";
import { doc, DocumentReference, getDoc, updateDoc } from "firebase/firestore";

export interface NotificationData {
    id: string;
    message: string;
    timestamp: Date;
    read: boolean;
    type?: string;
    relatedDocRef?: DocumentReference;
}

// Respond to a friend request notification
export async function respondToFriendRequest(requestRef: DocumentReference, accept: boolean, userId: string) { // requestRef is reference to FriendRequest document, NOT notification document
    try {
        // extract FriendRequest ID from DocumentReference
        const requestId = requestRef.id;

        // Send response to server
        const response = await fetch(`http://localhost:2400/api/users/respond-friend-request`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ requestId, accept, recId: userId }),
        });
        if (!response.ok) {
            throw new Error("Failed to respond to friend request");
        }

        console.log("Friend request response sent successfully.");
        alert("Friend request response sent successfully.");
    } catch (error) {
        console.error("Error responding to friend request:", error);
    } // end try catch
} // end function respondToFriendRequest

// Fetch the status of a friend request
export async function fetchFriendRequestStatus(friendRequestRef: DocumentReference) {
    const snap = await getDoc(friendRequestRef);
    if (!snap.exists()) return null;
    return snap.data().status; 
}

export async function getNotifications(
    notifRefs: DocumentReference[]
): Promise<NotificationData[]> {
    if (!notifRefs || notifRefs.length === 0) return [];

    try {
        const notifDocs = await Promise.all(
            notifRefs.map(async (ref) => {
                const docSnap = await getDoc(ref);
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    return {
                        id: docSnap.id,
                        message: data.message,
                        timestamp: data.timestamp?.toDate?.() ?? new Date(),
                        read: data.read ?? false,
                        type: data.type,
                        relatedDocRef: data.relatedDocRef,
                    } as NotificationData;
                }
                return null;
            })
        );

        return notifDocs.filter((n): n is NotificationData => n !== null);
    } catch (error) {
        console.error("Error fetching notifications:", error);
        throw error;
    } // end try catch
} // end function getNotifications

export async function markNotificationAsRead(notifId: string) {
    try {
        const notifRef = doc(db, "Notifs", notifId);
        await updateDoc(notifRef, { read: true });
        console.log(`Notification ${notifId} marked as read.`);
    } catch (err) {
        console.error("Error marking notification as read:", err);
    }
}
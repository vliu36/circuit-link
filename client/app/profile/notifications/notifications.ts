// Functions for managing user notifications

import { db } from "../../../app/_firebase/firebase";
import { arrayRemove, deleteDoc, doc, DocumentReference, getDoc, updateDoc } from "firebase/firestore";

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
        const response = await fetch(`https://api-circuit-link-160321257010.us-west2.run.app/api/users/respond-friend-request`, {
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
        
        // NOTE: We rely on the front-end state (requestStatus) to show feedback, 
        // not blocking 'alert' calls.
        
    } catch (error) {
        console.error("Error responding to friend request:", error);
        throw error; // Re-throw the error so the NavBar can revert the state
    }
}

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
    }
}

export async function markNotificationAsRead(notifId: string) {
    try {
        const notifRef = doc(db, "Notifs", notifId);
        await updateDoc(notifRef, { read: true });
        console.log(`Notification ${notifId} marked as read.`);
    } catch (err) {
        console.error("Error marking notification as read:", err);
    }
}

export async function deleteNotification(notifId: string, userId: string) {
    try {
        // Remove notification reference from user's document
        const userRef = doc(db, "Users", userId);
        const notifRef = doc(db, "Notifs", notifId);
        await updateDoc(userRef, {
            notifications: arrayRemove(notifRef),
        });
        // If the related document is a FriendRequest, consider deleting it as well
        const notifSnap = await getDoc(notifRef);
        if (notifSnap.exists() && notifSnap.data().type === "friend_request") {
            const friendRequestRef = notifSnap.data().relatedDocRef;
            if (friendRequestRef) {
                await deleteDoc(friendRequestRef);
            }
        }
        // Delete the notification document
        await deleteDoc(notifRef);
        console.log(`Notification ${notifId} deleted.`);
    } catch (err) {
        console.error("Error deleting notification:", err);
    }
}

export async function getPostRedirectUrl(postRef: DocumentReference) {
    const postSnap = await getDoc(postRef);
    if (!postSnap.exists()) return "#";

    const postData = postSnap.data();
    const postId = postSnap.id;

    // Fetch forum
    const forumRef: DocumentReference = postData.parentForum;
    const forumSnap = await getDoc(forumRef);
    if (!forumSnap.exists()) return "#";

    const forumData = forumSnap.data();
    const forumSlug = forumData.slug;

    // Fetch community
    const commRef: DocumentReference = postData.parentCommunity;
    const commSnap = await getDoc(commRef);
    if (!commSnap.exists()) return "#";

    const commData = commSnap.data();
    const commName = commData.name;

    return `/community/${commName}/${forumSlug}/${postId}`;
}
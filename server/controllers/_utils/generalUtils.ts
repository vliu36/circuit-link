// General utilities for controllers
import { Request } from "express";
import { DocumentReference, FieldValue, Timestamp } from "firebase-admin/firestore";
import { auth, db } from "../../firebase";



// Function to assist in parsing session cookie
export function cookieParser(req: Request): Record<string, string> {
    // Extract and parse cookies
    const cookieHeader = req.headers.cookie || "";
    const cookies: Record<string, string> = Object.fromEntries(
        cookieHeader
            .split(";")
            .map((pair) => pair.trim().split("="))
            .filter(([key, val]) => key && val)
            .map(([key, val]) => [key, decodeURIComponent(val)])
    ); // end of const cookies
    // Return the parsed cookies as a Record<string, string>
    return cookies;
}

// Function to assist in getting userId from session cookie
export async function getUserIdFromSessionCookie(req: Request): Promise<string> {
    const cookies = cookieParser(req);
    const sessionCookie = cookies.session;
    if (!sessionCookie) {
        throw new Error("Unauthorized: Missing session cookie");
    }
    const decodedClaims = await auth.verifySessionCookie(sessionCookie, true);
    return decodedClaims.uid;
}

// Create a new notification for a user
export async function createNotification({
    senderId,                       // User ID of the sender
    recipientId,                    // User ID of the recipient
    type,                           // Type of notification (e.g., "reply", "friend_request")
    message,                        // Notification message content
    relatedDocRef,                  // [OPTIONAL] Reference to related document (e.g., post, reply)
}: {
    senderId: string;
    recipientId: string;
    type: string;
    message: string;
    relatedDocRef?: DocumentReference;
}) {
    try {
        
        if (!senderId || !type || !message || !recipientId) {
            throw new Error("Missing required fields");
        }

        // Create the notification
        const notification = {
            senderId,
            recipientId,
            type,
            message,
            read: false,
            timestamp: new Date(),
            ...(relatedDocRef ? { relatedDocRef } : {}),
        };

        const notifRef = await db.collection("Notifs").add(notification);

        // Add reference to notification in recipient's document under field 'notifications'
        const recipientRef = db.collection("Users").doc(recipientId);
        await recipientRef.update({
            notifications: FieldValue.arrayUnion(notifRef)
        });

        console.log(`Notification created with ID: ${notifRef.id} for recipient: ${recipientId}`);
        return notifRef.id;
    } catch (error) {
        console.error("Error creating notification:", error);
        throw new Error("Internal server error");
    } // end try catch
} // end function createNotification

// Verify if a user is an owner or moderator of a community
export async function verifyUserIsOwnerOrMod(commData: any, userId: string, db: FirebaseFirestore.Firestore) {
    const userRef = db.doc(`/Users/${userId}`);

    const ownerList: FirebaseFirestore.DocumentReference[] = commData.ownerList || [];
    const modList: FirebaseFirestore.DocumentReference[] = commData.modList || [];

    const isOwner = ownerList.some(ref => ref.path === userRef.path);
    const isMod = modList.some(ref => ref.path === userRef.path);

    if (!isOwner && !isMod) {
        throw new Error("User is not authorized (must be owner or moderator)");
    }

    return { isOwner, isMod };
}
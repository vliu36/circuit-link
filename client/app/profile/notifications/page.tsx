// This page displays the user's notifications
"use client"
import { useAuth } from "../../_firebase/context";
import { DocumentReference, getDoc } from "firebase/firestore";
import { useState, useEffect } from "react";
import { getNotifications, NotificationData, markNotificationAsRead, respondToFriendRequest, deleteNotification, getPostRedirectUrl } from "./notifications";
import Link from "next/link";
// import NavBar from "../../_components/navbar/navbar.ts";

export default function Notifications() {
    const { user, userData, loading } = useAuth();
    
    const [notifications, setNotifications] = useState<NotificationData[]>([]);
    const [requestStatus, setRequestStatus] = useState<Record<string, string>>({});

    const [redirectUrls, setRedirectUrls] = useState<Record<string, string>>({});

    useEffect(() => {
        const fetchUrls = async () => {
            const urls: Record<string, string> = {};
            await Promise.all(
                notifications.map(async (notif) => {
                    if (notif.type === "report" && notif.relatedDocRef) {
                        urls[notif.id] = await getPostRedirectUrl(notif.relatedDocRef);
                    }
                })
            );
            setRedirectUrls(urls);
        };

        fetchUrls();
    }, [notifications]);

    // Fetch notifications and their friend request statuses if applicable
    useEffect(() => {
        if (!userData?.notifications) return;

        const fetchAll = async () => {
            try {
                // Fetch notification docs
                const notifDocs = await getNotifications(userData.notifications);

                // For friend request notifications, fetch their status
                const statuses: Record<string, string> = {};
                await Promise.all(
                    notifDocs.map(async (notif) => {
                        // Fetches the status of the notification's related document, which is a FriendRequest
                        if (notif.type === "friend_request" && notif.relatedDocRef) {
                            const docsSnap = await getDoc(notif.relatedDocRef);
                            if (docsSnap.exists()) {
                                statuses[notif.id] = docsSnap.data().status;
                            }
                        }
                    })
                );

                // Update states
                setNotifications(notifDocs);
                setRequestStatus(statuses);
            } catch (err) {
                console.error("Error fetching notifications:", err);
            }
        };

        fetchAll();
    }, [userData?.notifications]);

    // Handle marking notification as read
    async function markAsRead(notifId: string) {
        try {
            await markNotificationAsRead(notifId);
            // Update local state
            setNotifications((prevNotifs) =>
                prevNotifs.map((notif) =>
                    notif.id === notifId ? { ...notif, read: true } : notif
                )
            );
        } catch (error) {
            console.error("Error marking notification as read:", error);
        } // end try catch
    } // end function markAsRead

    // Handle responding to friend requests
    async function respondToRequest(requestRef: DocumentReference, accept: boolean, userId: string, notifId: string) {
        try {
            await respondToFriendRequest(requestRef, accept, userId);
            // Mark the notification as read
            markAsRead(notifId);

            // Update local state 
            setRequestStatus((prevStatus) => ({
                ...prevStatus,
                [notifId]: accept ? "accepted" : "declined",
            }));
        } catch (error) {
            console.error("Error responding to friend request:", error);
        } // end try catch
    } // end function respondToRequest

    // Handle deleteing a notification
    async function handleDelete(notifId: string) {
        try {
            await deleteNotification(notifId, user!.uid);
            // Update local state
            setNotifications((prevNotifs) =>
                prevNotifs.filter((notif) => notif.id !== notifId)
            );
        } catch (error) {
            console.error("Error deleting notification:", error);
        } // end try catch
    } // end function handleDelete

    // Loading states
    if (loading) {
        return <div>Loading...</div>;
    }
    if (!user || !userData) {
        return <div>You must be logged in to view notifications.</div>;
    }

    return (
        <div>
            <h1>Notifications Page</h1>
            <p>This is where user notifications will be displayed.</p>

            <div>
                <p>Logged in as: {userData?.username}</p>
            </div>
            <br/>

            {/* Show notification List */}
            <div>
                {/* If there are notifications, display them */}
                {notifications.length > 0 ? (
                    <ul>
                        {/* Map through notifications and display them */}
                        {notifications.map((notif) => (
                            <li key={notif.id}>
                                <br/>
                                {/* Notification content */}
                                <span>{notif.message}</span>
                                {/* Timestamp */}
                                <small> {notif.timestamp.toLocaleString()}</small>

                                {/* If notification is unread, show that it is; clicking on it marks it as read */}
                                {!notif.read && (
                                    <button onClick={() => markAsRead(notif.id)}>
                                        [Unread]
                                    </button>
                                )}
                                <button onClick={() => handleDelete(notif.id)}>
                                    [Delete Notification]
                                </button>

                                {/* If notification type is a 'friend_request', show it */}
                                {notif.type === "friend_request" && notif.relatedDocRef && (
                                    <div>
                                        {/* If status is pending, show accept/decline buttons */}
                                        {requestStatus[notif.id] === "pending" && (
                                            <>
                                                <button onClick={() => respondToRequest(notif.relatedDocRef!, true, user.uid, notif.id)}>
                                                    [Accept Friend Request]
                                                </button>
                                                <button onClick={() => respondToRequest(notif.relatedDocRef!, false, user.uid, notif.id)}>
                                                    [Decline Friend Request]
                                                </button>
                                            </>
                                        )}
                                        {/* If status is accepted, show accepted message */}
                                        {requestStatus[notif.id] === "accepted" && (
                                            <span><em>Accepted.</em></span>
                                        )}
                                        {/* If status is rejected, show rejected message */}
                                        {requestStatus[notif.id] === "rejected" && (
                                            <span><em>Rejected.</em></span>
                                        )}
                                    </div>
                                )} {/* End friend_request handling */}

                                {/* If notification type is a report, show it */}
                                {notif.type === "report" && notif.relatedDocRef && (
                                    // Link to view the reported post
                                    <div>
                                        <Link href={redirectUrls[notif.id] || "#"} target="_blank" rel="noopener noreferrer">
                                            [View Reported Post]
                                        </Link>
                                        {/* Show report status */}
                                        {requestStatus[notif.id] && (
                                            <span><em>Report Status: {requestStatus[notif.id]}</em></span>
                                        )}
                                    </div>
                                )} {/* End report handling */}

                            </li>
                        ))} {/* End mapping notifications */}
                    </ul> 
                ) : (
                    <ul>
                        <li>No notifications available.</li>
                    </ul>
                )}
            </div>

        </div>
    );
}
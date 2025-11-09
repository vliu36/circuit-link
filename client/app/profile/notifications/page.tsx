"use client"
import { useAuth } from "../../_firebase/context";
import { DocumentReference, getDoc } from "firebase/firestore";
import { useState, useEffect } from "react";
import { getNotifications, NotificationData, markNotificationAsRead, respondToFriendRequest } from "./notifications";

export default function Notifications() {
    const { user, userData, loading } = useAuth();
    
    const [notifications, setNotifications] = useState<NotificationData[]>([]);
    const [requestStatus, setRequestStatus] = useState<Record<string, string>>({});

    // Fetch notifications when userData.notifications changes
    // useEffect(() => {
    //     if (!userData?.notifications) return;

    //     getNotifications(userData.notifications)
    //         .then(setNotifications)
    //         .catch(console.error);
    // }, [userData?.notifications]);

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

    if (loading) {
        return <div>Loading...</div>;
    }

    if (!user || !userData) {
        return <div>You must be logged in to view notifications.</div>;
    }

    return(
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
                                    <button onClick={() => markNotificationAsRead(notif.id)}>
                                        [Unread]
                                    </button>
                                )}

                                {/* If notification type is a 'friend_request', show accept/decline buttons */}
                                {notif.type === "friend_request" && requestStatus[notif.id] === "pending" && notif.relatedDocRef && (
                                    
                                    <div>
                                        <button onClick={() => respondToFriendRequest(notif.relatedDocRef!, true, user.uid)}>
                                            [Accept Friend Request]
                                        </button>
                                        <button onClick={() => respondToFriendRequest(notif.relatedDocRef!, false, user.uid)}>
                                            [Decline Friend Request]
                                        </button>
                                    </div>
                                    
                                )}
                            </li>
                            
                        ))}
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
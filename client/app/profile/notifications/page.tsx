"use client";
import { useAuth } from "../../_firebase/context";
import { DocumentReference, getDoc } from "firebase/firestore";
import { useState, useEffect } from "react";
import {
    getNotifications,
    NotificationData,
    markNotificationAsRead,
    respondToFriendRequest,
    deleteNotification,
    getPostRedirectUrl
} from "./notifications";
import Link from "next/link";
import Styles from "./notifications.module.css";

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

    useEffect(() => {
        if (!userData?.notifications) return;

        const fetchAll = async () => {
            try {
                const notifDocs = await getNotifications(userData.notifications);
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

                setNotifications(notifDocs);
                setRequestStatus(statuses);
            } catch (err) {
                console.error("Error fetching notifications:", err);
            }
        };
        fetchAll();
    }, [userData?.notifications]);

    async function markAsRead(notifId: string) {
        await markNotificationAsRead(notifId);
        setNotifications((prev) =>
            prev.map((n) => (n.id === notifId ? { ...n, read: true } : n))
        );
    }

    async function respondToRequest(requestRef: DocumentReference, accept: boolean, userId: string, notifId: string) {
        await respondToFriendRequest(requestRef, accept, userId);
        markAsRead(notifId);

        setRequestStatus((prev) => ({
            ...prev,
            [notifId]: accept ? "accepted" : "rejected",
        }));
    }

    async function handleDelete(notifId: string) {
        await deleteNotification(notifId, user!.uid);
        setNotifications((prev) => prev.filter((n) => n.id !== notifId));
    }

    if (loading) return <div>Loading...</div>;
    if (!user || !userData) return <div>You must be logged in to view notifications.</div>;

    return (
        <div className={Styles.pageContainer}>
            <Link className = {Styles.backButton} href="/">Go Back</Link>
            {/* Title Card */}
            <div className={Styles.titleCard}>
                <h1>Notifications</h1>
                <p>Logged in as: {userData.username}</p>
            </div>

            {/* Notifications List */}
            <div className={Styles.notificationList}>
                {notifications.length > 0 ? (
                    <ul>
                        {notifications.map((notif) => (
                            <li key={notif.id} className={Styles.notificationItem}>
                                
                                <span>{notif.message}</span>
                                <span className={Styles.timeStamp}>
                                    {notif.timestamp.toLocaleString()}
                                </span>

                                {!notif.read && (
                                    <button
                                        className={`${Styles.btn} ${Styles.btnUnread}`}
                                        onClick={() => markAsRead(notif.id)}
                                    >
                                        Mark as Read
                                    </button>
                                )}

                                <button
                                    className={`${Styles.btn} ${Styles.btnDelete}`}
                                    onClick={() => handleDelete(notif.id)}
                                >
                                    Delete
                                </button>

                                {/* Friend Request Controls */}
                                {notif.type === "friend_request" && notif.relatedDocRef && (
                                    <div>
                                        {requestStatus[notif.id] === "pending" && (
                                            <>
                                                <button
                                                    className={`${Styles.btn} ${Styles.btnAccept}`}
                                                    onClick={() =>
                                                        respondToRequest(notif.relatedDocRef!, true, user.uid, notif.id)
                                                    }
                                                >
                                                    Accept
                                                </button>
                                                <button
                                                    className={`${Styles.btn} ${Styles.btnDecline}`}
                                                    onClick={() =>
                                                        respondToRequest(notif.relatedDocRef!, false, user.uid, notif.id)
                                                    }
                                                >
                                                    Decline
                                                </button>
                                            </>
                                        )}

                                        {requestStatus[notif.id] === "accepted" && (
                                            <span className={Styles.statusMsg}>Accepted.</span>
                                        )}

                                        {requestStatus[notif.id] === "rejected" && (
                                            <span className={Styles.statusMsg}>Rejected.</span>
                                        )}
                                    </div>
                                )}

                                {/* View Report Link */}
                                {notif.type === "report" && notif.relatedDocRef && (
                                    <div>
                                        <Link
                                            href={redirectUrls[notif.id] || "#"}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className={`${Styles.btn} ${Styles.btnView}`}
                                        >
                                            View Reported Post
                                        </Link>
                                    </div>
                                )}
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p>No notifications available.</p>
                )}
            </div>
        </div>
    );
}
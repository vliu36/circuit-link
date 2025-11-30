"use client"

import Styles from "./navbar.module.css";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useState, useRef } from "react";
import { User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore"; // <-- ADDED: For fetching user document
import { db } from "@/app/_firebase/firebase"; // <-- ADDED: Reference to Firestore DB
import { authStateCallback } from "@/app/_firebase/auth-observer.ts";
import { logout } from '@/app/landing.ts';
import HomeLogo from '../../../public/CircuitLinkHomeLogo.svg'
import { getNotifications, NotificationData, respondToFriendRequest } from "../../profile/notifications/notifications.ts";

export default function NavBar() {
    const [user, setUser] = useState<User | null>(null);
    const [isNotifOpen, setIsNotifOpen] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const notifRef = useRef<HTMLDivElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // ADDED STATE: To hold notification data
    const [notifications, setNotifications] = useState<NotificationData[]>([]);
    const [requestStatus, setRequestStatus] = useState<{ [key: string]: string }>({});

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
                setIsNotifOpen(false);
            }
        }
        if (isNotifOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isNotifOpen]);

    useEffect(() => {
        const unsubscribe = authStateCallback((user) => {
            setUser(user);
        });
        return () => unsubscribe();
    }, []);

    // ADDED EFFECT: Data fetching logic
    useEffect(() => {
        const fetchNotifs = async () => {
            if (user) {
                try {
                    // 1. Get the User Document to find the array of notification references
                    const userDocRef = doc(db, "Users", user.uid);
                    const userSnap = await getDoc(userDocRef);

                    if (userSnap.exists()) {
                        const userData = userSnap.data();
                        // Assuming the user document has a field named 'notifications' containing DocumentReferences
                        const notifRefs = userData.notifications || [];

                        if (notifRefs.length > 0) {
                            // 2. Hydrate the references into full notification objects
                            const data = await getNotifications(notifRefs);
                            // Set notifications, sorting by timestamp (newest first)
                            setNotifications(data.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()));
                        }
                    }
                } catch (error) {
                    console.error("Error fetching notifications:", error);
                }
            }
        };
        fetchNotifs();
    }, [user]);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        }
        if (isDropdownOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isDropdownOpen]);

    useEffect(() => {
        function handleProfileClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        }
        if (isDropdownOpen) {
            document.addEventListener("mousedown", handleProfileClickOutside);
        }
        return () => {
            document.removeEventListener("mousedown", handleProfileClickOutside);
        };
    }, [isDropdownOpen]);

    // ADDED HANDLER: Logic for accepting/declining requests
    const handleRespondToRequest = async (notifId: string, accept: boolean, userId: string) => {
        // Find the specific notification object to get the DocRef needed for the backend
        const targetNotif = notifications.find(n => n.id === notifId);

        if (targetNotif && targetNotif.relatedDocRef) {
            // Update UI immediately (optimistic update)
            setRequestStatus(prev => ({ ...prev, [notifId]: accept ? 'accepted' : 'rejected' }));

            try {
                // Call the backend function using the DocumentReference
                await respondToFriendRequest(targetNotif.relatedDocRef, accept, userId);
            } catch (error) {
                console.error("Failed to respond:", error);
                setRequestStatus(prev => ({ ...prev, [notifId]: 'pending' })); // Revert status on failure
            }
        }
    };

    const toggleNotif = () => {
        setIsNotifOpen(prev => !prev);
        setIsDropdownOpen(false); // Close profile
    };

    const toggleProfile = () => {
        setIsDropdownOpen(prev => !prev);
        setIsNotifOpen(false); // Close notifs
    };

    return (
        !user ? (
            <div className={Styles.navBox}>
                <div style={{ gridArea: 'Home' }}>
                    <Link href="/" replace>
                        <Image className={Styles.homeLogo} src={HomeLogo} width={200} height={50} alt="Circuit Link Logo" />
                    </Link>
                </div>

                <div className={Styles.loginAndSignUp}>
                    <Link className={Styles.logInSignUpButton} href="./signin"> Log In </Link>
                    <div className={Styles.orText}> or </div>
                    <Link className={Styles.logInSignUpButton} href="./register"> Sign Up </Link>
                </div>
                
            </div>
        )
            : (
                <div className={Styles.navBox2}>
                    {/*user signed in*/}
                    <div className={Styles.homeLogo} style={{ gridArea: 'Home' }}>
                        <Link href="/" replace>
                            <Image src={HomeLogo} alt="Logo" width={200} height={200}></Image>
                        </Link>
                    </div>

                    <div className={Styles.rightIcons} ref={notifRef} style={{ gridArea: 'notification' }}>
                        <button onClick={() => setIsNotifOpen(prev => !prev)}>
                            <Image src="/notification.svg" alt="Info" className={Styles.notificationButton} width={10} height={10}></Image>
                        </button>
                        {isNotifOpen && (
                            <div className={Styles.notifDropdownMenu}>
                                {/* RENDER NOTIFICATIONS */}
                                {notifications.length === 0 ? (
                                    <p style={{ padding: '15px', fontSize: '0.8rem', color: '#555' }}>No notifications</p>
                                ) : (
                                    notifications.map((notif) => (
                                        <div key={notif.id} style={{
                                            padding: '10px',
                                            borderBottom: '1px solid #ddd',
                                            width: '100%',
                                            textAlign: 'left'
                                        }}>
                                            <p style={{ fontSize: '0.85rem', margin: '0 0 5px 0' }}>{notif.message}</p>

                                            {/* Render Actions for Friend Requests */}
                                            {notif.type === "friend_request" && notif.relatedDocRef && user && (
                                                <div style={{ marginTop: '5px', display: 'flex', gap: '10px' }}>
                                                    {/* Check local status or default to pending */}
                                                    {(requestStatus[notif.id] || "pending") === "pending" && (
                                                        <>
                                                            <button
                                                                onClick={() => handleRespondToRequest(notif.id, true, user.uid)}
                                                                style={{ fontSize: '0.75rem', color: 'white', backgroundColor: '#4CAF50', border: 'none', borderRadius: '4px', padding: '2px 6px', cursor: 'pointer' }}
                                                            >
                                                                Accept
                                                            </button>
                                                            <button
                                                                onClick={() => handleRespondToRequest(notif.id, false, user.uid)}
                                                                style={{ fontSize: '0.75rem', color: 'white', backgroundColor: '#f44336', border: 'none', borderRadius: '4px', padding: '2px 6px', cursor: 'pointer' }}
                                                            >
                                                                Decline
                                                            </button>
                                                        </>
                                                    )}

                                                    {requestStatus[notif.id] === "accepted" && (
                                                        <span style={{ fontSize: '0.75rem', color: '#4CAF50', fontStyle: 'italic' }}>Accepted</span>
                                                    )}

                                                    {requestStatus[notif.id] === "rejected" && (
                                                        <span style={{ fontSize: '0.75rem', color: '#f44336', fontStyle: 'italic' }}>Declined</span>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    ))
                                )}
                                <Link
                                    href="http://localhost:3000/profile/notifications"
                                    style={{ fontSize: '0.8rem', color: '#3F6DA1', marginTop: '10px', marginBottom: '5px', textDecoration: 'underline' }}
                                    replace
                                >
                                    View All
                                </Link>
                            </div>
                        )}

                        <div className={Styles.dropdown} ref={dropdownRef} style={{ gridArea: 'settings' }}>
                            <button onClick={() => setIsDropdownOpen(prev => !prev)}>
                                <Image src={user?.photoURL || "/circleUser.svg"} className={Styles.settingsIcon} alt="User profile" width={10} height={10}></Image>
                            </button>
                            {isDropdownOpen && (
                                <div className={Styles.dropdownMenu}>
                                    <div className={Styles.buttonBox}>
                                        <Link href="http://localhost:3000/profile" replace>Profile</Link>
                                    </div>
                                    <div className={Styles.buttonBox}>
                                        <button style={{ color: 'black' }}>Settings</button>
                                    </div>
                                    <div className={Styles.buttonBox}>
                                        <button style={{ color: 'black' }} onClick={logout}>Log Out</button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className={Styles.line} style={{ gridArea: 'line' }}>
                    </div>
                    <div className={Styles.line} style={{ gridArea: 'line' }}></div>
                </div>

            )
    )
}
// This page allows users to view and edit their profile information, including uploading a profile picture, changing username, bio, and account settings.
"use client"
import React, { useState, useEffect } from "react";
import * as profileFunctions from "./profile";
import { useAuth } from "../_firebase/context";
import "./profile-styles.css";
import styles from "./profile.module.css"
import Image from 'next/image';
import Link from 'next/link';


export default function Profile() {
    const { user, userData, loading } = useAuth();

    const [file, setFile] = useState<File | null>(null);   // For profile picture upload
    const [preview, setPreview] = useState<string | null>(null); // For image preview

    // Profile edit states
    const [newUsername, setNewUsername] = useState("");
    const [newBio, setNewBio] = useState("");
    const [textSize, setTextSize] = useState(userData?.textSize ?? 12);
    const [font, setFont] = useState(userData?.font ?? "Arial");
    const [darkMode, setDarkMode] = useState(userData?.darkMode ?? true);
    const [privateMode, setPrivateMode] = useState(userData?.privateMode ?? false);
    const [restrictedMode, setRestrictedMode] = useState(userData?.restrictedMode ?? false);
    const [error, setError] = useState(""); // For username validation error messages
    const [message, setMessage] = useState(""); 
    const [status, setStatus] = useState("");

    // Friends list
    const [friends, setFriends] = useState<profileFunctions.User[]>([]);

    // Popup state
    const [isOpen, setIsOpen] = useState(false);
    const [alertPopup, setAlertPopup] = useState(false);

    // File size limit
    // const MAX_KB = 200;
    const MAX_MB = 5;
    const MAX_BYTES = MAX_MB * 1024 * 1024;

    // Live username validation
    useEffect(() => {
        if (!newUsername) {
            setError("");
            return;
        }
        const localError = profileFunctions.basicUsernameCheck(newUsername);
        setError(localError);

    }, [newUsername]); // end useEffect

    // Load friends list
    useEffect(() => {
        const loadFriends = async () => {
            if (!userData?.friendList) return;
            const data = await profileFunctions.getFriends(userData.friendList);
            setFriends(data);
        };
        loadFriends();
    }, [userData]);

    const toggleAlertPopup = () => {
        setAlertPopup(!alertPopup);
    }

    // Show loading message while auth state is being determined
    if (loading) {
        return <p>Loading user info...</p>;
    }

    // If no user is logged in, show message
    if (!user || !userData) {
        return (<p>You must be logged in to view this page.</p>);
    }

    // Handle form submission for editing profile
    const handleEditProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        const res = await profileFunctions.editProfile(newUsername, newBio, textSize, font, darkMode, privateMode, restrictedMode);
        if (res.status === "ok") {
            setMessage(res.message);
            setStatus("Success");
            toggleAlertPopup();
            // Reload after a short delay to show updated info
            setTimeout(() => {
                window.location.reload();
            }, 2000);
        } else {
            setMessage(res.message);
            setStatus("Error");
            toggleAlertPopup();
        }
    };

    // Popup Confirmation 
    const togglePopup = () => {
        setIsOpen(!isOpen);
    }

    // Handle image file change
    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0] || null;
        setFile(selectedFile);
        if (selectedFile) {
            setPreview(URL.createObjectURL(selectedFile));
        } else {
            setPreview(null);
        } // end if else
    } // end handleFileChange

    // Handle image file submission
    const submitImage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) {
            return;
        }
        // Check file size 
        if (file.size > MAX_BYTES) {
            setMessage(`File size exceeds the maximum allowed limit: ${MAX_MB} MB.`);
            setStatus("Error");
            console.log("File size exceeds the maximum allowed limit.");
            toggleAlertPopup();
            return;
        }
        try {
            const url = await profileFunctions.uploadProfilePicture(file);
            setMessage("Profile picture uploaded successfully.");
            setStatus("Success");
            toggleAlertPopup();
            console.log("File URL: ", url);
            window.location.reload();
        } catch (error) {
            console.warn("Error uploading profile picture:", error);
            setMessage("Error uploading profile picture.");
            setStatus("Error");
            toggleAlertPopup();
        } // end try catch
    } // end submitImage

    // Handle removing a friend
    const handleRemoveFriend = async (friendId: string) => {
        try {
            await profileFunctions.removeFriend(friendId);
            // Optimistically remove from local state
            setFriends(prevFriends => prevFriends.filter(f => f.id !== friendId));
        } catch (error) {
            console.warn("Error removing friend:", error);
            setMessage("Error removing friend.");
            setStatus("Error");
            toggleAlertPopup();
        }
    };

    // Handle delete account
    const handleDeleteAccount = async () => {
        try {
            const result = await profileFunctions.deleteUserAccount();
            if (result.status === "ok") {
                setMessage(result.message);
                setStatus("Success");
                toggleAlertPopup();
                // Redirect to home after a short delay to allow user to read message
                setTimeout(() => {
                    window.location.href = "/";
                }, 2000);
            }
        } catch (error) {
            console.warn("Error deleting account:", error);
            setMessage("An error occurred while deleting your account.");
            setStatus("Error");
            toggleAlertPopup();
        }
    };

    // Handle verify email
    const handleVerifyEmail = async () => {
        try {
            const result = await profileFunctions.verifyEmail();
            setMessage(result.message);
            setStatus(result.status === "ok" ? "Success" : "Error");
            toggleAlertPopup();
        } catch (error) {
            console.warn("Error verifying email:", error);
            setMessage("An error occurred while sending verification email.");
            setStatus("Error");
            toggleAlertPopup();
        }
    };

    return (
        <main className={styles.main}>

            {/* Profile */}
            <div className={styles.profileCard}>
                <h1>Profile</h1>
                <p>Welcome to your profile page!</p>

                <button
                    className={styles.goBackBtn}
                    onClick={() => { window.location.href = "/"; }}
                >
                    Go back
                </button>

                <br /><br />

                <Link className={styles.goBackBtn} href="/profile/notifications">
                    Go to Notifications
                </Link>

                <br /><br />

                {/* Profile header */}
                <div className={styles.profileHeader}>
                    <Image
                        src={user.photoURL || "https://upload.wikimedia.org/wikipedia/commons/a/ac/Default_pfp.jpg"}
                        alt="Profile Picture"
                        width={64}
                        height={64}
                        className={styles.profileHeaderImage}
                    />
                    <span className={styles.profileHeaderUsername}>
                        {userData?.username}
                    </span>
                </div>

                <p>{userData?.profileDesc}</p>
            </div>

            {/* Account info */}
            <div className={styles.accountInfo}>
                <p className={styles.infoText}>Email Verified: {user?.emailVerified ? "Yes" : "No"}</p>

                {!user?.emailVerified && (
                    <button className={styles.verifyBtn} onClick={handleVerifyEmail}>
                        Verify Email
                    </button>
                )}

                <p className={styles.infoText}>Account Created: {user?.metadata.creationTime}</p>
                <p className={styles.infoText}>Last Sign-in: {user?.metadata.lastSignInTime}</p>
            </div>

            {/* Friend list */}
            <div className={styles.accountInfo}>
                <h2 className={styles.sectionTitle}>Friends</h2>

                {friends.length > 0 ? (
                    <ul className={styles.friendList}>
                        {friends.map((friend) => (
                            <li key={friend.id} className={styles.friendItem}>
                                <Link href={`/profile/${friend.id}`} className={styles.friendLink}>
                                    <Image
                                        src={friend.photoURL || "https://upload.wikimedia.org/wikipedia/commons/a/ac/Default_pfp.jpg"}
                                        width={32}
                                        height={32}
                                        alt="Profile Picture"
                                        className={styles.friendAvatar}
                                    />
                                    {friend.username}
                                </Link>

                                <button
                                    className={styles.removeFriendBtn}
                                    onClick={() => handleRemoveFriend(friend.id)}
                                >
                                    Remove
                                </button>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className={styles.emptyState}>No friends to display.</p>
                )}
            </div>

            {/* Change profile picture */}
            <form onSubmit={submitImage} className={styles.form}>
                <label className={styles.fileInput}>
                    Change Profile Picture
                    <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleImageChange}
                    />
                </label>

                {preview && (
                    <Image
                        src={preview}
                        alt="Preview"
                        width={100}
                        height={100}
                        className={styles.previewAvatar}
                    />
                )}

                <button type="submit" className={styles.uploadBtn} disabled={!file}>
                    Upload
                </button>

                <p>File size limit: {MAX_MB} MB</p>
            </form>

            {/* Edit profile */}
            <form onSubmit={handleEditProfile} className={styles.form}>

                <label className={styles.label}>New Username (max 20 characters):</label>
                <input
                    type="text"
                    name="username"
                    minLength={1}
                    maxLength={20}
                    pattern="^[a-zA-Z0-9_]+$"
                    className={styles.inputText}
                    onChange={(e) => setNewUsername(e.target.value)}
                />
                {error && <span className={styles.errorMessage}>{error}</span>}

                <label className={styles.label}>New Bio (max 200 characters):</label>
                <textarea
                    name="profileDesc"
                    minLength={0}
                    maxLength={200}
                    rows={8}
                    className={styles.textarea}
                    onChange={(e) => setNewBio(e.target.value)}
                />

                <label className={styles.label}>Text Size:</label>
                <input
                    type="number"
                    name="textSize"
                    defaultValue={userData?.textSize}
                    min={8}
                    max={72}
                    className={styles.inputNumber}
                    onChange={(e) => setTextSize(Number(e.target.value))}
                />
                <em> - effect to be implemented</em>

                <label className={styles.label}>Font:</label>
                <select
                    name="font"
                    defaultValue={userData?.font}
                    className={styles.select}
                    onChange={(e) => setFont(e.target.value)}
                >
                    <option value="Arial">Arial</option>
                    <option value="Verdana">Verdana</option>
                    <option value="Helvetica">Helvetica</option>
                    <option value="Times New Roman">Times New Roman</option>
                    <option value="Courier New">Courier New</option>
                    <option value="Georgia">Georgia</option>
                    <option value="Comic Sans">Comic Sans</option>
                </select>
                <em> - effect to be implemented</em>

                <label className={styles.label}>
                    Dark Mode:
                    <input
                        type="checkbox"
                        className={styles.checkbox}
                        defaultChecked={userData?.darkMode}
                        onChange={(e) => setDarkMode(e.target.checked)}
                    />
                </label>
                <em> - effect to be implemented</em>

                <label className={styles.label}>
                    Private Mode:
                    <input
                        type="checkbox"
                        className={styles.checkbox}
                        defaultChecked={userData?.privateMode}
                        onChange={(e) => setPrivateMode(e.target.checked)}
                    />
                </label>
                <em> - effect to be implemented</em>

                <label className={styles.label}>
                    Restricted Mode:
                    <input
                        type="checkbox"
                        className={styles.checkbox}
                        defaultChecked={userData?.restrictedMode}
                        onChange={(e) => setRestrictedMode(e.target.checked)}
                    />
                </label>
                <em> - effect to be implemented</em>

                <button type="submit" className={styles.submitBtn}>
                    Save Changes
                </button>
            </form>

            {/* Delete + Logout */}
            <div className={styles.bottomActions}>
                <button className={styles.deleteBtn} onClick={togglePopup}>
                    Delete Profile
                </button>

                {isOpen && (
                    <div className={styles.confirmOverlay} onClick={togglePopup}>
                        <div className={styles.confirmModal} onClick={(e) => e.stopPropagation()}>
                            <h2 className={styles.confirmModalTitle}>Are you sure?</h2>

                            <div className={styles.confirmActions}>
                                <button className={styles.btnCancel} onClick={togglePopup}>
                                    Close
                                </button>
                                <button className={styles.btnConfirm} onClick={handleDeleteAccount}>
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                <button className={styles.logoutBtn} onClick={profileFunctions.logout}>
                    Log Out
                </button>
            </div>

            {alertPopup && (
                <div className={styles.confirmOverlay} onClick={toggleAlertPopup}>
                    <div className={styles.confirmModal} onClick={(e) => e.stopPropagation()}>
                        <h2 className={styles.confirmModalTitle}>{status || "Alert"}</h2>
                        {message && <p>{message}</p>}

                        <div className={styles.confirmActions}>
                            <button className={styles.btnConfirm} onClick={toggleAlertPopup}>
                                OK
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </main>
    );
}
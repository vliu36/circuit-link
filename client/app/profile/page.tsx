// This page allows users to view and edit their profile information, including uploading a profile picture, changing username, bio, and account settings.
"use client"
import React, { useState, useEffect } from "react";
import * as profileFunctions from "./profile";
import { useAuth } from "../_firebase/context";
import Styles from './profile.module.css';
import Image from 'next/image';
import Link from 'next/link';

export default function Profile() {
    const { user, userData, loading } = useAuth();    

    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    
    const [newUsername, setNewUsername] = useState("");
    const [newBio, setNewBio] = useState("");   
    const [textSize, setTextSize] = useState(userData?.textSize ?? 12);     
    const [font, setFont] = useState(userData?.font ?? "Arial");
    const [darkMode, setDarkMode] = useState(userData?.darkMode ?? true); 
    const [privateMode, setPrivateMode] = useState(userData?.privateMode ?? false);
    const [restrictedMode, setRestrictedMode] = useState(userData?.restrictedMode ?? false);
    const [error, setError] = useState("");

    const [friends, setFriends] = useState<profileFunctions.User[]>([]); 
    const [isOpen, setIsOpen] = useState(false);

    const MAX_KB = 200;
    const MAX_BYTES = MAX_KB * 1024;

    useEffect(() => {
        if (!newUsername) {
            setError("");
            return;
        }
        const localError = profileFunctions.basicUsernameCheck(newUsername);
        setError(localError);
    }, [newUsername]);

    useEffect(() => {
        const loadFriends = async () => {
            if (!userData?.friendList) return;
            const data = await profileFunctions.getFriends(userData.friendList);
            setFriends(data);
        };
        loadFriends();
    }, [userData]);

    if (loading) {
        return <p>Loading user info...</p>;
    }

    if (!user || !userData) {
        return ( <p>You must be logged in to view this page.</p> );
    }

    const handleEditProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        await profileFunctions.editProfile(newUsername, newBio, textSize, font, darkMode, privateMode, restrictedMode);
        window.location.reload();
    };

    const togglePopup = () => {
        setIsOpen(!isOpen);
    }

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0] || null;
        setFile(selectedFile);
        setPreview(selectedFile ? URL.createObjectURL(selectedFile) : null);
    }

    const submitImage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) {
            alert("Please select a file to upload.");
            return;
        }
        if (file.size > MAX_BYTES) {
            alert(`File size exceeds the maximum allowed limit: ${MAX_KB}.`);
            return;
        }
        try {
            const url = await profileFunctions.uploadProfilePicture(file);
            alert("Profile picture uploaded successfully.");
            console.log("File URL: ", url);
            window.location.reload();
        } catch (error) {
            console.error("Error uploading profile picture:", error);
        }
    }

    const handleRemoveFriend = async (friendId: string) => {
        try {
            await profileFunctions.removeFriend(friendId);
            setFriends(prevFriends => prevFriends.filter(f => f.id !== friendId));
        } catch (error) {
            console.error("Error removing friend:", error);
        }
    };

    return (
        <main className={Styles.main}>
            {/* Profile */}
            <div className={Styles.profileCard}>
                <h1 className={Styles.title}>Profile</h1>
                <p className={Styles.subtitle}>Welcome to your profile page!</p>
                
                <Link className={Styles.goBackBtn} href="/">Go back</Link>
                <br/>
                <br/>
                <Link className={Styles.goBackBtn} href="/profile/notifications">Go to Notifications</Link>
                <br/>
                <br/>
                {/* Display profile info */}
                <div className={Styles.profileHeader}>
                    <Image
                        src={userData.photoURL || user.photoURL || "https://upload.wikimedia.org/wikipedia/commons/a/ac/Default_pfp.jpg"} 
                        alt="Profile Picture"
                        width={64}
                        height={64}
                        className={Styles.profileHeaderImage}
                    />
                    <span className={Styles.profileHeaderUsername}>{userData?.username}</span>
                </div>
                <p className={Styles.bioText}>{userData?.profileDesc}</p>
            </div>

            {/* Additional information */}
            <div className={Styles.accountInfo}>
                <p>Email Verified: {user?.emailVerified ? "Yes" : "No"}</p>
                {!user?.emailVerified && (
                    <span>
                        <button className={Styles.verifyBtn} onClick={profileFunctions.verifyEmail}>
                            Verify Email
                        </button>
                    </span>
                )}
                <p>Account Created: {user?.metadata.creationTime}</p>
                <p>Last Sign-in: {user?.metadata.lastSignInTime}</p>
            </div>

            {/* Friend list */}
            <div className={Styles.accountInfo}>
                <h2 className={Styles.sectionTitle}>Friends</h2>
                <br/>
                {friends.length > 0 ? (
                    <ul className={Styles.friendList}>
                        {friends.map((friend) => (
                            <li key={friend.id} className={Styles.friendItem}>
                                <Link className={Styles.friendLink} href={`/profile/${friend.id}`}>
                                    <Image 
                                        src={friend.photoURL || "https://upload.wikimedia.org/wikipedia/commons/a/ac/Default_pfp.jpg"} 
                                        width={32} 
                                        height={32} 
                                        alt="Profile Picture" 
                                        className={Styles.friendAvatar}
                                    />
                                    {friend.username}
                                </Link>
                                <button className={Styles.removeFriendBtn} onClick={() => handleRemoveFriend(friend.id)}>X</button>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className={Styles.emptyState}>No friends to display.</p>
                )}
            </div>

            {/* Change profile picture */}
            <div className={Styles.accountInfo}>
                <br/>
                <form onSubmit={submitImage} className={Styles.uploadForm}>
                    <label className={Styles.uploadLabel}>
                        Change Profile Picture
                        <br/>
                        <input
                            type="file"
                            accept="image/*"
                            className={Styles.fileInput}
                            onChange={handleImageChange}
                        />
                    </label>
                    {preview && (
                        <Image
                            src={preview}
                            alt="Preview"
                            width={128}
                            height={128}
                            className={Styles.previewAvatar}
                        />
                    )}
                    <button
                        type="submit"
                        className={Styles.uploadBtn}
                        disabled={!file}
                    >
                        Upload
                    </button>
                    <p className={Styles.helperText}>File size limit: {MAX_KB} KB</p>
                </form>
            </div>
            
            <br/>
            {/* Edit profile */}
            <div className={Styles.accountInfo}>
                <form onSubmit={handleEditProfile} className={Styles.editForm}>
                    {/* Change username */}
                    <label className={Styles.label}>New Username (max 20 characters): </label>
                    <input 
                        type="text" 
                        id="username" 
                        name="username" 
                        minLength={1} 
                        maxLength={20} 
                        pattern="^[a-zA-Z0-9_]+$" 
                        className={Styles.inputText}
                        onChange={(e) => setNewUsername(e.target.value)}
                    />
                    {error && <span className={Styles.errorMessage}>{error}</span>}
                    <br/>
                    {/* Change profile description */}
                    <label className={Styles.label}>New Bio (max 200 characters): </label>
                    <textarea
                        className={Styles.textarea}
                        name="profileDesc"
                        minLength={0}
                        maxLength={200}
                        rows={8}
                        cols={32}
                        onChange={(e) => {setNewBio(e.target.value)}}
                    />
                    <br/>
                    {/* Change Text Size */}
                    <label className={Styles.label}>Text Size: </label>
                    <input
                        type="number"
                        name="textSize"
                        defaultValue={userData?.textSize}
                        min={8}
                        max={72}
                        className={Styles.inputNumber}
                        onChange={(e) => {setTextSize(Number(e.target.value))}}
                    />
                    <em className={Styles.note}> -  effect to be implemented </em>
                    <br/>
                    {/* Change Font */}
                    <label className={Styles.label}>Font: </label>
                    <select
                        id="font"
                        name="font"
                        defaultValue={userData?.font}
                        className={Styles.select}
                        onChange={(e) => {setFont(e.target.value)}}
                    >
                        <option value="Arial">Arial</option>
                        <option value="Verdana">Verdana</option>
                        <option value="Helvetica">Helvetica</option>
                        <option value="Times New Roman">Times New Roman</option>
                        <option value="Courier New">Courier New</option>
                        <option value="Georgia">Georgia</option>
                        <option value="Comic Sans">Comic Sans</option>
                    </select>
                    <em className={Styles.note}> -  effect to be implemented </em>
                    <br/>
                    {/* Dark Mode */}
                    <label className={Styles.labelInline}>Dark Mode: </label>
                    <input
                        type="checkbox"
                        name="darkMode"
                        defaultChecked={userData?.darkMode}
                        className={Styles.checkbox}
                        onChange={(e) => {setDarkMode(e.target.checked)}}
                    />
                    <em className={Styles.note}> -  effect to be implemented </em>
                    <br/>
                    {/* Private Mode */}
                    <label className={Styles.labelInline}>Private Mode: </label>
                    <input
                        type="checkbox"
                        name="privateMode"
                        defaultChecked={userData?.privateMode}
                        className={Styles.checkbox}
                        onChange={(e) => {setPrivateMode(e.target.checked)}}
                    />
                    <em className={Styles.note}> -  effect to be implemented </em>
                    <br/>
                    {/* Restricted Mode */}
                    <label className={Styles.labelInline}>Restricted Mode: </label>
                    <input
                        type="checkbox"
                        name="restrictedMode"
                        defaultChecked={userData?.restrictedMode}
                        className={Styles.checkbox}
                        onChange={(e) => {setRestrictedMode(e.target.checked)}}
                    />
                    <em className={Styles.note}> -  effect to be implemented </em>
                    <br/>
                    <button type="submit" className={Styles.submitBtn}>Save Changes</button>
                </form>
            </div>

            <br/>
            <div className={Styles.bottomActions}>
                {/* Delete profile button */}
                <button className={Styles.deleteBtn} onClick={togglePopup}>Delete Profile</button>
                {isOpen && (
                    <div className={Styles.confirmOverlay} onClick={togglePopup}>
                        <div 
                            className={Styles.confirmModal}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <h2 className={Styles.popupText}>Are you sure?</h2>
                            <div className={Styles.confirmActions}>
                                <button className={Styles.btnCancel} onClick={togglePopup}>Close</button>
                                <button className={Styles.btnConfirm} onClick={() => {profileFunctions.deleteUserAccount()}}>Delete</button>
                            </div>
                        </div>
                    </div>
                )}
                <br/>
                <br/>
                {/* Log out */}
                <button className={Styles.logoutBtn} onClick={() => { profileFunctions.logout(); }}>Log Out</button>
            </div>
        </main>
    );
}
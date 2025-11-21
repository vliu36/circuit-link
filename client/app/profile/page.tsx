// This page allows users to view and edit their profile information, including uploading a profile picture, changing username, bio, and account settings.
"use client"
import React, { useState, useEffect } from "react";
import * as profileFunctions from "./profile";
import { useAuth } from "../_firebase/context";
import "./profile-styles.css";
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
    const [error, setError] = useState("");

    // Friends list
    const [friends, setFriends] = useState<profileFunctions.User[]>([]); 
    
    // Popup state
    const [isOpen, setIsOpen] = useState(false);

    // File size limit
    const MAX_KB = 200;
    const MAX_BYTES = MAX_KB * 1024;

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

    // Show loading message while auth state is being determined
    if (loading) {
        return <p>Loading user info...</p>;
    }

    // If no user is logged in, show message
    if (!user || !userData) {
        return ( <p>You must be logged in to view this page.</p> );
    }

    // Handle form submission for editing profile
    const handleEditProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        await profileFunctions.editProfile(newUsername, newBio, textSize, font, darkMode, privateMode, restrictedMode);
        window.location.reload(); // Reload the page to show updated info
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
            alert("Please select a file to upload.");
            return;
        }
        // Check file size 
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
        } // end try catch
    } // end submitImage

    // Handle removing a friend
    const handleRemoveFriend = async (friendId: string) => {
        try {
            await profileFunctions.removeFriend(friendId, user.uid);
            // Optimistically remove from local state
            setFriends(prevFriends => prevFriends.filter(f => f.id !== friendId));
        } catch (error) {
            console.error("Error removing friend:", error);
        }
    };

    return (
        <main>
            {/* Profile */}
            <div className="profile-card">
                <h1>Profile</h1>
                <p>Welcome to your profile page!</p>
                <Link className="go-back-btn" href = "http://localhost:3000" replace>Go back</Link>
                <br/>
                <br/>
                <Link className="go-back-btn" href = "/profile/notifications">Go to Notifications</Link>
                <br/>
                <br/>
                {/* Display profile info */}
                <div className="profile-header">
                    <Image
                    src={user.photoURL || "https://upload.wikimedia.org/wikipedia/commons/a/ac/Default_pfp.jpg"} 
                    alt="Profile Picture"
                    width={64}
                    height={64}
                    className="w-16 h-16 rounded-full object-cover border" />
                    <span className="username">{userData?.username}</span>
                </div>
                <p>{userData?.profileDesc}</p>
            </div>
            {/* Additional information */}
            <div className="account-info">
                <p>Email Verified: {user?.emailVerified ? "Yes" : "No"}</p>
                {/* Show verify email button when user isn't verified */}
                {!user?.emailVerified && <span><button onClick={profileFunctions.verifyEmail}><u>&gt; Verify Email</u></button></span>}
                <p>Account Created: {user?.metadata.creationTime}</p>
                <p>Last Sign-in: {user?.metadata.lastSignInTime}</p>
            </div>

            {/* Friend list */}
            <div className="account-info">
                <h2>Friends</h2>
                <br/>
                {friends.length > 0 ? (
                    <ul>
                        {friends.map((friend) => (
                            <li key={friend.id}>
                                <Link href={`/profile/${friend.id}`}>
                                    <Image 
                                        src={friend.photoURL || "https://upload.wikimedia.org/wikipedia/commons/a/ac/Default_pfp.jpg"} 
                                        width={32} 
                                        height={32} 
                                        alt="Profile Picture" 
                                        className="w-16 h-16 rounded-full object-cover border" 
                                    />
                                    {friend.username}
                                </Link>
                                <button onClick={() => handleRemoveFriend(friend.id)}>Remove</button>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p>No friends to display.</p>
                )}
            </div>

            {/* Change profile picture */}
            <div>
                <br/>
                <form onSubmit={submitImage} className="flex items-left gap-4">
                    <label className="cursor-pointer border p-2 rounded-1g">
                        Change Profile Picture
                        <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleImageChange}/>
                    </label>
                    {preview && (<Image src={preview} alt="Preview" width={16} height={16} className="w-16 h-16 rounded-full object-cover border"></Image>)}
                    <button
                        type="submit"
                        disabled={!file}>Upload
                    </button>
                    <p>File size limit: {MAX_KB} KB</p>
                </form>
            </div>
            
            <br/>
            {/* Edit profile */}
            <div>
                <form onSubmit={handleEditProfile}>
                    {/* Change username */}
                    <label>New Username (max 20 characters): </label>
                    <input 
                    type="text" 
                    id="username" 
                    name="username" 
                    minLength={1} 
                    maxLength={20} 
                    pattern="^[a-zA-Z0-9_]+$" 
                    onChange={(e) => setNewUsername(e.target.value)}/>
                    {error && <span className="errorMessage"> {error}</span>} {/* Display username error */}
                    <br/>
                    {/* Change profile description */}
                    <label>New Bio (max 200 characters): </label>
                    <textarea className="bio" name="profileDesc" minLength={0} maxLength={200} rows={8} cols={32} onChange={(e) => {setNewBio(e.target.value)}}/>
                    <br/>
                    {/* Change Text Size */}
                    <label>Text Size: </label>
                    <input type="number" name="textSize" defaultValue={userData?.textSize} min={8} max={72} onChange={(e) => {setTextSize(Number(e.target.value))}}/>
                    <em> -  effect to be implemented </em>
                    <br/>
                    {/* Change Font */}
                    <label>Font: </label>
                    <select id="font" name="font" defaultValue={userData?.font} onChange={(e) => {setFont(e.target.value)}}>
                        <option value="Arial">Arial</option>
                        <option value="Verdana">Verdana</option>
                        <option value="Helvetica">Helvetica</option>
                        <option value="Times New Roman">Times New Roman</option>
                        <option value="Courier New">Courier New</option>
                        <option value="Georgia">Georgia</option>
                        <option value="Comic Sans">Comic Sans</option>
                    </select>
                    <em> -  effect to be implemented </em>
                    <br/>
                    {/* Dark Mode */}
                    <label>Dark Mode: </label>
                    <input type="checkbox" name="darkMode" defaultChecked={userData?.darkMode} onChange={(e) => {setDarkMode(e.target.checked)}}/>
                    <em> -  effect to be implemented </em>
                    <br/>
                    {/* Private Mode */}
                    <label>Private Mode: </label>
                    <input type="checkbox" name="privateMode" defaultChecked={userData?.privateMode} onChange={(e) => {setPrivateMode(e.target.checked)}} />
                    <em> -  effect to be implemented </em>
                    <br/>
                    {/* Restricted Mode */}
                    <label>Restricted Mode: </label>
                    <input type="checkbox" name="restrictedMode" defaultChecked={userData?.restrictedMode} onChange={(e) => {setRestrictedMode(e.target.checked)}} />
                    <em> -  effect to be implemented </em>
                    <br/>
                    <button type="submit"><u>&gt; Save Changes</u></button>
                </form>
            </div>

            <br/>
            <div className="bottom-actions">
                {/* Delete profile button */}
                <button className="delete-btn" onClick={togglePopup}>Delete Profile</button>
                {isOpen && (
                    <div className="confirm-overlay" onClick={togglePopup}>
                        <div 
                        className="confirm-modal"
                        onClick={(e) => e.stopPropagation()}>
                            <h2 className="popup-text">Are you sure?</h2>
                            <div className="confirm-actions">
                                <button className="btn-cancel" onClick={togglePopup}>Close</button>
                                <button className="btn-confirm" onClick={() => {profileFunctions.deleteUserAccount()}}>Delete</button>
                            </div>
                        </div>
                    </div>
                )}
                <br/>
                <br/>
                {/* Log out */}
                <script className="logout-btn" onClick={() => { profileFunctions.logout(); }}>Log Out</script>
            </div>
        </main>
    );
}
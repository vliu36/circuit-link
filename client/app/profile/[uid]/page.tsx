// This page displays another user's profile based on the UID in the URL.
"use client"
import React, { useState, useEffect } from "react";
import { useAuth } from "../../_firebase/context";
import "../profile-styles.css";
import Image from 'next/image';
import Link from 'next/link';
import * as profileFunctions from "./userProfile";
import { DocumentReference } from "firebase/firestore";


export default function OtherProfile({ params }: { params: Promise<{ uid: string }> }) {
    const { user, userData, loading } = useAuth();

    const [isloading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [other, setOther] = useState<profileFunctions.OtherUserData | null>(null);
    const [otherId, setOtherId] = useState<string | null>(null);
    // const [friends, setFriends] = useState<User[]>([]);
    
    useEffect(() => {
        const resolveUidAndFetch = async () => {
            const { uid } = await params; 
            if (!uid) {
                setError("No UID provided");
                setLoading(false);
                return;
            }
            
            setOtherId(uid);

            try {
                const data = await profileFunctions.fetchUserById(uid);
                if (!data) {
                    setError("User not found");
                    setOther(null);
                } else {
                    setOther(data);
                }
            } catch (err) {
                setError("Error fetching user profile: " + err);
                console.log(err);
                setOther(null);
            } finally {
                setLoading(false);
            }
        };

        resolveUidAndFetch();
    }, [params]);

    if (loading || isloading) {
        return <p>Loading user info...</p>;
    }

    // If no user is logged in, show message
    if (!user || !userData) {
        return ( <p>You must be logged in to view this page.</p> );
    }

    // If no profile data found, show message
    if (!other || !otherId) {
        return ( <p>User not found.</p> );
    }

    // Display error, if any
    if (error) {
        return <p style={{ color: "red" }}>{error}</p>;
    }

    // If current user is viewing their own profile, redirect to /profile page
    if (otherId === user.uid) {
        window.location.href = "https://circuitlink-160321257010.us-west2.run.app/profile";
        return null;
    }

    const createdTime = other.user.createdAt ? new Date(other.user.createdAt) : null;

    // Extract friend IDs for easier checking
    const friendRefs = userData.friendList as DocumentReference[];
    const friends = friendRefs.map((ref: DocumentReference) => ref.id);
    const safeUserData = {
        ...userData,
        friendList: friends,
    }

    return (
        <main>
            <div className="profile-card">
                <h1>Profile</h1>
                <p>Welcome to your profile page!</p>
                {/* // NOTE: This link takes the user back to the landing page, rather than the previous page */}
                <Link className="go-back-btn" href = "/profile">Go back</Link> 
                <br/>
                <br/>
                <div className="profile-header">
                    <Image
                    src={other.user.photoURL || "https://upload.wikimedia.org/wikipedia/commons/a/ac/Default_pfp.jpg"} 
                    alt="Profile Picture"
                    width={64}
                    height={64}
                    className="w-16 h-16 rounded-full object-cover border"/>
                    <span className="username">{other.user.username}</span>
                </div>
                <p>{other.user.profileDesc}</p>
            </div>
            <div className="account-info">
                <p>Account Created: {createdTime?.toLocaleString() || "N/A"}</p>
            </div>
            {/* If other user is not in current user's friend list, show button to add friend */}
            {user && other && !safeUserData.friendList.includes(otherId) && (
                <button onClick={() => profileFunctions.sendFriendRequest(user.uid, otherId)}>
                    Add Friend
                </button>
            )}
            {user && other && (
                <Link href={`/profile/${otherId}/dms`}>
                    <button>
                        Chat with {other.user.username}
                    </button>
                </Link>
            )}
        </main>
    );
}
"use client";
import { Suspense, useEffect, useState } from "react";
import Styles from "./landingPage.module.css";
import { useAuth } from "./_firebase/context.tsx";
import SearchBar from "./_components/searchbar/search.tsx";
import SearchResults from "./_components/searchbar/table.tsx";
import NavBar from "./_components/navbar/navbar.tsx";
import { fetchTopCommunities, fetchTopUsers } from "./landing.ts";
import Image from "next/image";
import { getCommunities } from "./landing.ts";
import { DocumentData } from "firebase/firestore";
import YourCommunities from "./_components/yourCommunities/yourCommBar";
import ResourcesBar from "./_components/resources/resources.tsx";
import TopUsers from "./_components/topUsers/topUsers.tsx";
import TopCommunities from "./_components/topCommunities/topCommunities.tsx";
import * as profileFunctions from "./profile/profile.ts";
import trashBin from "../public/trash-solid-full.svg"
import Link from "next/link";

export default function Landing() {
    // ─────────────────────────────────────────────
    // AUTH HOOKS — ALWAYS RUN
    // ─────────────────────────────────────────────
    const { user, userData, loading } = useAuth();

    // ─────────────────────────────────────────────
    // ALL STATE HOOKS — ALWAYS RUN (never inside conditions)
    // ─────────────────────────────────────────────
    const [topCommunities, setTopCommunities] = useState<DocumentData[]>([]);
    const [topUsers, setTopUsers] = useState<DocumentData[]>([]);
    const [userCommunities, setUserCommunities] = useState<DocumentData[]>([]);
    const [dataLoading, setDataLoading] = useState(true);

    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);

    const [newUsername, setNewUsername] = useState("");
    const [newBio, setNewBio] = useState("");

    // settings (these read userData, but hook order is stable)
    const [textSize, setTextSize] = useState(12);
    const [font, setFont] = useState("Arial");
    const [darkMode, setDarkMode] = useState(true);
    const [privateMode, setPrivateMode] = useState(false);
    const [restrictedMode, setRestrictedMode] = useState(false);

    const [error, setError] = useState("");

    const [friends, setFriends] = useState<profileFunctions.User[]>([]);
    const [isOpen, setIsOpen] = useState(false);

    // File limits
    const MAX_KB = 200;
    const MAX_BYTES = MAX_KB * 1024;

    // EFFECT: Handle bfcache (back/forward cache) issues
    // useEffect(() => {
    // const handlePageShow = (event: PageTransitionEvent) => {
    //     if (event.persisted) {
    //     // Page was restored from bfcache
    //     window.dispatchEvent(new Event("resize")); // trigger layout recalculation
    //     }
    // };

    // window.addEventListener("pageshow", handlePageShow);

    // return () => {
    //     window.removeEventListener("pageshow", handlePageShow);
    // };
    // }, []);

    // ─────────────────────────────────────────────
    // EFFECT: Update profile settings when userData loads
    // ─────────────────────────────────────────────
    useEffect(() => {
        if (userData) {
            setTextSize(userData.textSize ?? 12);
            setFont(userData.font ?? "Arial");
            setDarkMode(userData.darkMode ?? true);
            setPrivateMode(userData.privateMode ?? false);
            setRestrictedMode(userData.restrictedMode ?? false);
        }
    }, [userData]);

    // ─────────────────────────────────────────────
    // EFFECT: Live username validation
    // ─────────────────────────────────────────────
    useEffect(() => {
        if (!newUsername) return setError("");
        setError(profileFunctions.basicUsernameCheck(newUsername));
    }, [newUsername]);

    // ─────────────────────────────────────────────
    // EFFECT: Load friends
    // ─────────────────────────────────────────────
    useEffect(() => {
        if (!userData?.friendList) return;

        const loadFriends = async () => {
            const data = await profileFunctions.getFriends(userData.friendList);
            setFriends(data);
        };

        loadFriends();
    }, [userData]);

    // ─────────────────────────────────────────────
    // EFFECT: Load communities + top users
    // RUNS EVEN IF USER IS LOGGED OUT — SAFE
    // ─────────────────────────────────────────────
    useEffect(() => {
        if (loading) return;

        const loadData = async () => {
            const comms = await fetchTopCommunities();
            const users = await fetchTopUsers();

            setTopCommunities(comms.communities ?? []);
            setTopUsers(users.users ?? []);

            if (userData?.communities) {
                const joined = await getCommunities(userData.communities);
                setUserCommunities(joined);
            }

            setDataLoading(false);
        };

        loadData();
    }, [loading, userData]);

    // ─────────────────────────────────────────────
    // EVENT HANDLERS — NO HOOKS
    // ─────────────────────────────────────────────
    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0] ?? null;
        setFile(selectedFile);
        setPreview(selectedFile ? URL.createObjectURL(selectedFile) : null);
    };

    const submitImage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) return alert("Please select a file.");

        if (file.size > MAX_BYTES)
            return alert(`File exceeds ${MAX_KB}KB.`);

        const url = await profileFunctions.uploadProfilePicture(file);
        console.log("Uploaded:", url);
        alert("Profile picture uploaded.");
        window.location.reload();
    };

    const handleRemoveFriend = async (friendId: string) => {
        await profileFunctions.removeFriend(friendId);
        setFriends(prev => prev.filter(f => f.id !== friendId));
    };

    // ─────────────────────────────────────────────
    // RENDER — ALL HOOKS HAVE ALREADY RUN
    // ─────────────────────────────────────────────

    if (loading) {
        return (
            <div className={Styles.notLoggedInContainer}>
                <NavBar />
                <p>Loading user info...</p>
            </div>
        );
    }

    // GUEST VIEW — SAFE (AFTER hooks)
    if (!user || !userData) {
        return (
            <div className={Styles.notLoggedInContainer}>
                <NavBar />
                <p>You must be logged in to view this page.</p>
            </div>
        );
    }
    

    // LOGGED-IN VIEW
    return (
        <main className={Styles.landingMain}>
            <div className={Styles.navBox} style={{ gridArea: "navBar" }}>
                <NavBar />
            </div>

            <div className={Styles.background}>

                <div className={Styles.yourCommunitiesBar} style={{ gridArea: "communities" }}>
                    <YourCommunities userCommunities={userCommunities} />
                </div>

                <div className={Styles.resourcesBar} style={{ gridArea: "resources" }}>
                    <ResourcesBar />
                </div>

                <div className={Styles.topUsersBar} style={{ gridArea: "topUsers" }}>
                    <TopUsers dataLoading={dataLoading} topUsers={topUsers} />
                </div>

                <div className={Styles.topCommunitiesBar} style={{ gridArea: "topCommunities" }}>
                    <TopCommunities dataLoading={dataLoading} topCommunities={topCommunities} />
                </div>



                <div className={Styles.friendsBox} style={{ gridArea: "friendReq" }}>
                    <h2 className={Styles.sectionTitle}>Your Friends</h2>

                    {friends.length === 0 ? (
                        <p className={Styles.noFriendsText}>You have no friends yet.</p>
                    ) : (
                        <ul className={Styles.friendList}>
                            {friends.map((f) => (
                                <div key={f.id} className={Styles.fullFriendItem}>
                                    <Link href={`profile/${f.id}/dms`} className={Styles.friendItem} >
                                        <Image
                                            src={f.photoURL || "/defaultPFP.png"}
                                            alt={`${f.username}'s profile`}
                                            width={40}
                                            height={40}
                                            className={Styles.friendsIcon}
                                        />

                                        <p className={Styles.friendName}>{f.username}</p>
                                        <p className={Styles.friendBio}>{f.profileDesc ?? ""}</p>
                                    </Link>


                                    <button
                                        className={Styles.removeFriendButton}
                                        onClick={() => handleRemoveFriend(f.id)}
                                    >
                                        <Image
                                            src={trashBin}
                                            alt="Trash"
                                            width={20}
                                            height={20}
                                        />
                                    </button>
                                </div>

                            ))}
                        </ul>

                    )}
                </div>

                <div className={Styles.searchBarArea} style={{ gridArea: "search" }}>
                    <div className={Styles.welcomeText}>Welcome to Circuit-Link,</div>
                    <div className={Styles.usernameText}>{user.displayName}</div>

                    <h3 className={Styles.searchBarAlignment}>
                        <Suspense fallback={<div>Loading search bar...</div>}>
                            <SearchBar />
                        </Suspense>
                    </h3>

                    <SearchResults />
                </div>
            </div>
        </main>

    );
}
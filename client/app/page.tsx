"use client";
import { Suspense, useEffect, useState } from "react";
import Styles from "./landingPage.module.css";
import { useAuth } from "./_firebase/context.tsx";
import SearchBar from "./_components/searchbar/search.tsx";
import SearchResults from "./_components/searchbar/table.tsx";
import NavBar from "./_components/navbar/navbar.tsx";
import { Community, fetchTopCommunities, fetchTopUsers, logout } from "./landing.ts";
import Image from "next/image";
import Link from "next/link";
import { getCommunities } from "./landing.ts";
import { User } from "firebase/auth";
import { DocumentData } from "firebase/firestore";
import YourCommunities from "./_components/yourCommunities/yourCommBar";
import ResourcesBar from "./_components/resources/resources.tsx"
import TopUsers from "./_components/topUsers/topUsers.tsx"
import TopCommunities from "./_components/topCommunities/topCommunities.tsx";


export default function Landing() {
    const { user, userData, loading } = useAuth();

    const [topCommunities, setTopCommunities] = useState<DocumentData[]>([]);
    const [topUsers, setTopUsers] = useState<DocumentData[]>([]);
    const [userCommunities, setUserCommunities] = useState<DocumentData[]>([]);
    const [dataLoading, setDataLoading] = useState(true);

    useEffect(() => {
        if (loading) return;

        async function loadData() {
            const comms = await fetchTopCommunities();
            const users = await fetchTopUsers();

            setTopCommunities(comms.communities ?? []);
            setTopUsers(users.users ?? []);

            if (userData?.communities) {
                try {
                    const joined = await getCommunities(userData.communities);
                    setUserCommunities(joined);
                } catch (err) {
                    console.error("Error loading user's communities:", err);
                }
            }

            setDataLoading(false);
        }

        loadData();
    }, [userData, loading]);

    return (
        <div className={Styles.background}>
            <div className={Styles.yourCommunitiesBar} style={{ gridArea: "communities" }}>
                <YourCommunities userCommunities={userCommunities} />
            </div>

            <div className={Styles.resourcesBar} style={{ gridArea: "resources" }}>
                <ResourcesBar/>
            </div>

            <div className={Styles.topUsersBar} style={{ gridArea: "topUsers" }}>
                <TopUsers dataLoading={dataLoading} topUsers={topUsers} />
            </div>

            <div className={Styles.topCommunitiesBar} style={{ gridArea: "topCommunities" }}>
                <TopCommunities dataLoading={dataLoading} topCommunities={topCommunities} />
            </div>

            <div className={Styles.navBox} style={{ gridArea: "navBar" }}>
                <NavBar />
            </div>

            <div className={Styles.friendsBox} style={{ gridArea: "friendReq" }}></div>

            <div className={Styles.searchBarArea} style={{ gridArea: "search" }}>
                <div className={Styles.welcomeText}>Welcome to Circuit-Link,</div>
                <div className={Styles.usernameText}>{user?.displayName}</div>
                <h3 className={Styles.searchBarAlignment}>
                    <Suspense fallback={<div>Loading search bar...</div>}>
                        <SearchBar />
                    </Suspense>
                </h3>
                <h4>
                    <SearchResults />
                </h4>
            </div>
        </div>
    );
}

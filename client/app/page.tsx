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
                <h1>Your Communities</h1>

                <div>
                    {userCommunities.length === 0 ? (
                        <p>No joined communities.</p>
                    ) : (
                        userCommunities.map((c: DocumentData, i: number) => (
                            <Link
                                key={c.id}
                                className={Styles.communitiesButtons}
                                href={`/community/${c.name}`}
                            >
                                <Image
                                    src={c.icon ?? "/defaultCommunity.svg"}
                                    alt={c.name}
                                    width={30}
                                    height={30}
                                    className={Styles.addIcon}
                                />
                                <h1 className={Styles.buttonTextforCommunities}>{c.name}</h1>
                            </Link>
                        ))
                    )}
                </div>

                <Link className={Styles.communitiesButtons} href={`/community`}>
                    <Image src="/plus.svg" className={Styles.addIcon} alt="Add icon" width={16} height={16} />
                    <h1 className={Styles.buttonTextforCommunities}>Add a Community</h1>
                </Link>
            </div>

            <div className={Styles.resourcesBar} style={{ gridArea: "resources" }}>
                <h1>Resources</h1>
                <Link className={Styles.resourcesBarButtons} href="./aboutus" replace>
                    <Image src="/aboutUsNew.svg" className={Styles.aboutUsIcon} alt="About us icon" width={16} height={16} />
                    <h1 className={Styles.buttonText}>About Circuit Link</h1>
                </Link>
                <Link className={Styles.resourcesBarButtons} href="./help" replace>
                    <Image src="/helpIconNew.svg" className={Styles.aboutUsIcon} alt="Question mark" width={16} height={16} />
                    <h1 className={Styles.buttonText}>Get Help</h1>
                </Link>
                <Link className={Styles.resourcesBarButtons} href="./bugreports" replace>
                    <Image src="/reportIconNew.svg" className={Styles.aboutUsIcon} alt="Bug icon" width={16} height={16} />
                    <h1 className={Styles.buttonText}>Report A Bug</h1>
                </Link>
                <Link className={Styles.resourcesBarButtons} href="./siterules" replace>
                    <Image src="/rulesNew.svg" className={Styles.aboutUsIcon} alt="Book icon" width={16} height={16} />
                    <h1 className={Styles.buttonText}>Circuit Link Rules</h1>
                </Link>
            </div>

            <div className={Styles.topUsersBar} style={{ gridArea: "topUsers" }}>
                <h1>Top Users</h1>

                <div className={Styles.topCommunitesScroll}>
                    {dataLoading && topUsers.length === 0 ? (
                        <p>Loading...</p>
                    ) : topUsers.length === 0 ? (
                        <p>No users found.</p>
                    ) : (
                        topUsers.map((u: DocumentData, idx: number) => {
                            const key = u.id ?? u._id ?? `user-${idx}`;
                            const username = u.username ?? u.displayName ?? u.name ?? "Unknown user";
                            const photo = u.photoURL ?? u.avatar ?? u.photo ?? "/defaultUser.svg";
                            const yay = typeof u.yayScore === "number" ? u.yayScore : Number(u.yays) || 0;

                            return (
                                <div key={key} className={Styles.topUserItem}>
                                    <Image src={photo} alt={username} width={30} height={30} className={Styles.topUserIcon} />

                                    <div className={Styles.topUserName}>
                                        <h1>{username}</h1>
                                        <h1>{yay} Yay Score</h1>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            <div className={Styles.topCommunitiesBar} style={{ gridArea: "topCommunities" }}>
                <h1>Top Communities</h1>

                <div className={Styles.topCommunitesScroll}>
                    {dataLoading && topCommunities.length === 0 ? (
                        <p>Loading...</p>
                    ) : topCommunities.length === 0 ? (
                        <p>No communities found.</p>
                    ) : (
                        topCommunities.map((c: DocumentData, idx: number) => {
                            const key = c.id ?? c._id ?? `comm-${idx}`;
                            const name = c.name ?? c.title ?? "Unnamed community";
                            const icon = c.icon ?? c.image ?? "/defaultCommunity.svg";
                            const yay = typeof c.yayScore === "number" ? c.yayScore : Number(c.yays) || 0;
                            const numUsers = typeof c.numUsers === "number" ? c.numUsers : Number(c.numUsers) || 0;

                            return (
                                <Link key={key} className={Styles.topCommunitiesItem} href={`/community/${name}`}>
                                    <Image src={icon} alt={name} width={30} height={30} className={Styles.topCommunitiesIcon} />
                                    <div className={Styles.topCommunitiesName}>
                                        <h1 className={Styles.communitiesTitle}>{name}</h1>
                                        <h1>{yay} Yays</h1>
                                        <h1>{numUsers} Followers</h1>
                                    </div>
                                </Link>
                            );
                        })
                    )}
                </div>
            </div>

            <div className={Styles.navBox} style={{ gridArea: "navBar" }}>
                <NavBar />
            </div>

            <div className={Styles.blankBox} style={{ gridArea: "blankBox" }}></div>

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

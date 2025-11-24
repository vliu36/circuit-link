"use client";

import Image from "next/image";
import Styles from "./topUsers.module.css";
import { DocumentData } from "firebase/firestore";

interface Props {
    dataLoading: boolean;
    topUsers: DocumentData[];
}

export default function TopUsers({ dataLoading, topUsers }: Props) {
    return (
        <div className={Styles.topUsersBar}>
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
                                    <Image src={photo} alt={username} width={40} height={40} className={Styles.topUserIcon} />

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
    );
}
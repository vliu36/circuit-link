"use client";

import Image from "next/image";
import Link from "next/link";
import Styles from "./topComms.module.css";
import { DocumentData } from "firebase/firestore";

interface Props {
    dataLoading: boolean;
    topCommunities: DocumentData[];
}

export default function TopCommunities({ dataLoading, topCommunities }: Props) {
    return (
        <div className={Styles.topCommunitiesBar} style={{ gridArea: "topCommunities" }}>
            <h1 className = {Styles.titleName}>Top Communities</h1>
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
                                <Image
                                    src={icon}
                                    alt={name}
                                    width={60}
                                    height={30}
                                    className={Styles.topCommunitiesIcon}
                                />
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

    );
}
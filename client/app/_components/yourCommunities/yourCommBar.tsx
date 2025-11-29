"use client";

import Link from "next/link";
import Image from "next/image";
import Styles from "./communities.module.css";
import { DocumentData } from "firebase/firestore";
import { useState } from "react";
import CreateCommunityPopup from "./createCommunityPopup";

interface Props {
    userCommunities: DocumentData[];
}


export default function YourCommunities({ userCommunities }: Props) {
    const [createPopup, setCreatePopup] = useState(false);
    const [message, setMessage] = useState<string | null>(null);

    // --- Toggle popups ---
    const toggleCreatePopup = () => {
        setCreatePopup(!createPopup);
        setMessage(null);
    }

    return (
        <div className={Styles.yourCommunitiesBar}>
            <h1>Your Communities</h1>

            <div className={Styles.scrollSpace}>
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

                <button
                    className={Styles.communitiesButtons}
                    onClick={() => setCreatePopup(true)}
                >
                    <Image src="/plus.svg" className={Styles.addIcon} alt="Add icon" width={16} height={16} />
                    <h1 className={Styles.buttonTextforCommunities}>Add a Community</h1>
                </button>

                {createPopup && (
                    <CreateCommunityPopup onClose={() => setCreatePopup(false)} />
                )}
            </div >


        </div >
    );
}
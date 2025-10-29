"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "../../context.tsx";
import { useReplies, Reply, Post } from "./replies.ts";
import styles from "./repliesPage.module.css";



export default function RepliesPage() {
    const MAX_DEPTH = 5;
    const { user, loading: authLoading } = useAuth();
    const { postId } = useParams();
    const postIdStr = Array.isArray(postId) ? postId[0] : postId; // postId is either a string or an array of strings, this converts it to a single string
    const { post, handleVote, addReply } = useReplies(postIdStr || "", user?.uid);

    const [activeReplyTo, setActiveReplyTo] = useState<string | null>(null);
    const [replyContent, setReplyContent] = useState("");

    // Recursive render function for post + replies
    const renderPostOrReply = (item: Post | Reply, depth = 0) => {
        if (depth >= MAX_DEPTH) return null;
        const isReply = "timeReply" in item;

        return (
            <div key={item.id} className={styles.replyCard} style={{ marginLeft: `${depth * 20}px` }}>
                <p>{item.contents}</p>
                <p className={styles.meta}>
                    <strong>Author:</strong> {item.authorUsername} | <strong>Yay Score:</strong> {item.yayScore}
                </p>
                <p className={styles.time}>{isReply ? item.timeReply : item.timePosted}</p>

                <div className={styles.actions}>
                    <button
                        className={`${styles.voteButton} ${user?.uid && item.yayList.includes(user.uid) ? styles.yayActive : ""}`}
                        onClick={() => handleVote(item.id, "yay", isReply)}
                    >
                        👍 Yay
                    </button>
                    <button
                        className={`${styles.voteButton} ${user?.uid && item.nayList.includes(user.uid) ? styles.nayActive : ""}`}
                        onClick={() => handleVote(item.id, "nay", isReply)}
                    >
                        👎 Nay
                    </button>
                    <button
                        className={styles.editButton}
                        onClick={() => setActiveReplyTo(activeReplyTo === item.id ? null : item.id)}
                        disabled={depth >= MAX_DEPTH-1}
                    >
                        Reply
                    </button>
                </div>

                {activeReplyTo === item.id && (
                    <div style={{ marginTop: "10px" }}>
                        <textarea
                            className={styles.replyInput}
                            placeholder="Write a reply..."
                            value={replyContent}
                            onChange={(e) => setReplyContent(e.target.value)}
                        />
                        <button
                            className={styles.editButton}
                            onClick={() => {
                                addReply(item.id, replyContent, isReply);
                                setReplyContent("");
                                setActiveReplyTo(null);
                            }}
                        >
                            Submit
                        </button>
                    </div>
                )}

                {"listOfReplies" in item && item.listOfReplies.length > 0 && (
                    <div style={{ marginTop: "15px" }}>
                        {item.listOfReplies.map(r => renderPostOrReply(r, depth + 1))}
                    </div>
                )}
            </div>
        );
    };

    if (authLoading) return <div>Loading...</div>;
    if (!user) return <div>Sign in to view replies!</div>;
    if (!post) return <div>Loading post...</div>;

    return (
        <div className={styles.container}>
            {post ? renderPostOrReply(post) : <p>Loading post...</p>}
        </div>
    );
}
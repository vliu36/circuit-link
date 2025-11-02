"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "../../context.tsx";
import { useReplies, Reply, Post } from "./replies.ts";
import styles from "./repliesPage.module.css";
// import { fetchAllPosts } from "../posts.ts";

export default function RepliesPage() {
    const MAX_DEPTH = 5;
    const { user, loading: authLoading } = useAuth();
    const { postId } = useParams();
    const postIdStr = Array.isArray(postId) ? postId[0] : postId;
    const { post, handleVote, addReply, deleteReplyById, editReply, deletePostById, editPost, fetchPost } = useReplies(postIdStr || "", user?.uid);

    const [activeReplyTo, setActiveReplyTo] = useState<string | null>(null);
    const [replyContent, setReplyContent] = useState("");
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editContent, setEditContent] = useState("");
    const [editTitle, setEditTitle] = useState("");

    // Utility for edit and delete (we call backend functions dynamically)
    const handleEdit = async (id: string, isReply: boolean) => {
        if (!editContent.trim()) return alert("Content cannot be empty.");
        try {
            if (isReply) {
                await editReply(id, user?.uid, editContent);
            } else if (post) {
                await editPost(post.id, user?.uid, editTitle, editContent)
            }
            setEditingId(null);
            setEditContent("");
            setEditTitle("");
            fetchPost();
        } catch (err) {
            console.error("Failed to edit:", err);
        }
    };

    const handleDelete = async (id: string, isReply: boolean) => {
        if (!confirm("Are you sure you want to delete this?")) return;
        try {
            if (isReply) {
                await deleteReplyById(id, user?.uid);
                fetchPost();
            } else if (post) {
                await deletePostById(id, user?.uid);
                window.location.href = "/posts";
            }            
        } catch (err) {
            console.error("Failed to delete:", err);
        }
    };

    // Recursive render for posts and replies
    const renderPostOrReply = (item: Post | Reply, depth = 0) => {
        if (depth >= MAX_DEPTH) return null;
        const isReply = "timeReply" in item;
        const isOwner = item.authorId === user?.uid;

        return (
            <div
                key={item.id}
                className={styles.replyCard}
                style={{ marginLeft: `${depth * 20}px` }}
            >
                {editingId === item.id ? (
                    <div style={{ marginBottom: "10px" }}>
                        {/* Title input only for posts */}
                        {!isReply && (
                            <input
                                className={styles.replyInput}
                                value={editTitle}
                                onChange={(e) => setEditTitle(e.target.value)}
                                placeholder="Edit title"
                            />
                        )}
                        {/* Contents textarea for both posts and replies */}
                        <textarea
                            className={styles.replyInput}
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            placeholder="Edit contents"
                        />
                        <div className={styles.actions}>
                            <button
                                className={styles.editButton}
                                onClick={() => handleEdit(item.id, isReply)}
                            >
                                Save
                            </button>
                            <button
                                className={styles.deleteButton}
                                onClick={() => {
                                    setEditingId(null);
                                    setEditContent("");
                                    setEditTitle("");
                                }}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Post title */}
                        {"title" in item && <h2 className={styles.title}>{item.title}</h2>}
                        <p className={styles.contents}>{item.contents}</p>
                        <p className={styles.meta}>
                            <strong>Author:</strong> {item.authorUsername} |{" "}
                            <strong>Yay Score:</strong> {item.yayScore}
                        </p>
                        <p className={styles.time}>
                            {isReply ? item.timeReply : item.timePosted}
                            {item.edited && <span> (edited)</span>}
                        </p>

                        <div className={styles.actions}>
                            <button
                                className={`${styles.voteButton} ${
                                    user?.uid && item.yayList.includes(user.uid)
                                        ? styles.yayActive
                                        : ""
                                }`}
                                onClick={() => handleVote(item.id, "yay", isReply)}
                            >
                                👍 Yay
                            </button>
                            <button
                                className={`${styles.voteButton} ${
                                    user?.uid && item.nayList.includes(user.uid)
                                        ? styles.nayActive
                                        : ""
                                }`}
                                onClick={() => handleVote(item.id, "nay", isReply)}
                            >
                                👎 Nay
                            </button>
                            <button
                                className={styles.replyButton}
                                onClick={() =>
                                    setActiveReplyTo(
                                        activeReplyTo === item.id ? null : item.id
                                    )
                                }
                                disabled={depth >= MAX_DEPTH - 1}
                            >
                                Reply
                            </button>

                            {isOwner && (
                                <>
                                    <button
                                        className={styles.editButton}
                                        onClick={() => {
                                            setEditingId(item.id);
                                            setEditContent(item.contents);
                                            if (!isReply) setEditTitle(item.title);
                                        }}
                                    >
                                        Edit
                                    </button>
                                    <button
                                        className={styles.deleteButton}
                                        onClick={() => handleDelete(item.id, isReply)}
                                    >
                                        Delete
                                    </button>
                                </>
                            )}
                        </div>
                    </>
                )}

                {/* Reply input area */}
                {activeReplyTo === item.id && (
                    <div style={{ marginTop: "10px" }}>
                        <textarea
                            className={styles.replyInput}
                            placeholder="Write a reply..."
                            value={replyContent}
                            onChange={(e) => setReplyContent(e.target.value)}
                        />
                        <button
                            className={styles.replyButton}
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

                {/* Render nested replies recursively */}
                {"listOfReplies" in item && item.listOfReplies.length > 0 && (
                    <div style={{ marginTop: "15px" }}>
                        {item.listOfReplies.map((r) =>
                            renderPostOrReply(r, depth + 1)
                        )}
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
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../context";
import Link from "next/link";
import { fetchAllPosts, createPost, editPost, deletePostById, votePost } from "./posts.ts";
import styles from "./postsPage.module.css";

type Post = {
    id: string;
    title: string;
    contents: string;
    authorUsername: string;
    authorId: string;
    yayScore: number;
    yayList: string[];
    nayList: string[];
    timePosted: string;
    edited: boolean;
};

export default function PostsPage() {
    const { user, loading } = useAuth();
    const [posts, setPosts] = useState<Post[]>([]);
    const [title, setTitle] = useState("");
    const [contents, setContents] = useState("");

    const [editingPostId, setEditingPostId] = useState<string | null>(null);
    const [editTitle, setEditTitle] = useState("");
    const [editContents, setEditContents] = useState("");

    // Fetch posts from backend
    const fetchPosts = async () => {
        try {
            const data = await fetchAllPosts();
            const formattedPosts = (data || []).map((post: Post) => ({
                ...post,
                timePosted: post.timePosted
                    ? new Date(post.timePosted).toLocaleString()
                    : "Unknown",
            }));
            setPosts(formattedPosts);
        } catch (err) {
            console.error("Failed to fetch posts:", err);
        }
    };

    useEffect(() => {
        fetchPosts();
    }, []);

    const handleAddPost = async () => {
        if (!user) return alert("Sign in to post!");
        if (!title || !contents) return alert("Please fill out title and contents");

        try {
            const msg = await createPost(user.uid, title, contents);
            alert(msg);
            setTitle("");
            setContents("");
            fetchPosts();
        } catch (err) {
            console.error(err);
        }
    };

    const handleSaveEdit = async (postId: string) => {
        try {
            const msg = await editPost(postId, user?.uid, editTitle, editContents);
            alert(msg);
            cancelEditing();
            fetchPosts();
        } catch (err) {
            console.error("Failed to edit post:", err);
        }
    };

    const cancelEditing = () => {
        setEditingPostId(null);
        setEditTitle("");
        setEditContents("");
    };

    const handleDeletePost = async (postId: string) => {
        if (!confirm("Are you sure you want to delete this post?")) return;
        try {
            const msg = await deletePostById(postId, user?.uid);
            alert(msg);
            fetchPosts();
        } catch (err) {
            console.error(err);
        }
    };

    const handleVote = async (postId: string, type: "yay" | "nay") => {
        if (!user) return alert("Sign in to vote!");
        try {
            await votePost(postId, user.uid, type);
            fetchPosts();
        } catch (err) {
            console.error(err);
        }
    };

    if (loading) return <div>Loading...</div>;
    if (!user) return <div>Sign in to view posts!</div>;

    return (
        <div className={styles.container}>
            <Link href="/landing" className={styles.backButton}>
            <h1 className={styles.backButtonText}>Back</h1>
            </Link>
            <h1 className={styles.header}>Posts Demo</h1>

            {/* --- New Post Section --- */}
            <div className={styles.createSection}>
                <h2>Create New Post</h2>
                <input
                    placeholder="Post Title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className={styles.input}
                />
                <textarea
                    placeholder="Post Contents"
                    value={contents}
                    onChange={(e) => setContents(e.target.value)}
                    className={styles.textarea}
                />
                <button className={styles.primaryButton} onClick={handleAddPost}>
                    Add Post
                </button>
            </div>

            {/* --- Posts List --- */}
            <h2>All Posts</h2>
            {posts.length === 0 ? (
                <p>No posts found.</p>
            ) : (
                posts.map((post) => {
                    const isAuthor = post.authorId === user.uid;
                    const isEditing = editingPostId === post.id;

                    return (
                        <div
                            key={post.id}
                            className={styles.postCard}
                        >
                            {isEditing ? (
                                <>
                                    <input
                                        value={editTitle}
                                        onChange={(e) => setEditTitle(e.target.value)}
                                        className={styles.input}
                                    />
                                    <textarea
                                        value={editContents}
                                        onChange={(e) => setEditContents(e.target.value)}
                                        className={styles.textarea}
                                    />
                                    <button
                                        onClick={() => handleSaveEdit(post.id)}
                                        className={`${styles.button} ${styles.saveButton}`}
                                    >
                                        Save
                                    </button>
                                    <button
                                        onClick={cancelEditing}
                                        className={`${styles.button} ${styles.cancelButton}`}
                                    >
                                        Cancel
                                    </button>
                                </>
                            ) : (
                                <>
                                    {/* Wrap clickable area for the post */}
                                    <Link href={`/posts/${post.id}`}>
                                        <h3 className={styles.title}>{post.title}</h3>
                                        <p className={styles.contents}>{post.contents}</p>
                                    </Link>
                                    <p className={styles.meta}>
                                        <strong>Author:</strong> {post.authorUsername}
                                    </p>
                                    <p className={styles.time}>
                                        {post.timePosted} {post.edited && "(edited)"}
                                    </p>
                                    <p className={styles.meta}>
                                        <strong>Yay Score:</strong> {post.yayScore}
                                    </p>

                                    <div className={styles.actions}>
                                        <button
                                            onClick={() => handleVote(post.id, "yay")}
                                            className={`${styles.voteButton} ${
                                                post.yayList.includes(user.uid) ? styles.yayActive : ""
                                            }`}
                                        >
                                            👍 Yay
                                        </button>
                                        <button
                                            onClick={() => handleVote(post.id, "nay")}
                                            className={`${styles.voteButton} ${
                                                post.nayList.includes(user.uid) ? styles.nayActive : ""
                                            }`}
                                        >
                                            👎 Nay
                                        </button>

                                        {isAuthor && (
                                            <>
                                                <button
                                                    onClick={() => {
                                                        setEditingPostId(post.id);
                                                        setEditTitle(post.title);
                                                        setEditContents(post.contents);
                                                    }}
                                                    className={`${styles.button} ${styles.editButton}`}
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => handleDeletePost(post.id)}
                                                    className={`${styles.button} ${styles.deleteButton}`}
                                                >
                                                    Delete
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    );
                })
            )}
        </div>
    );
}
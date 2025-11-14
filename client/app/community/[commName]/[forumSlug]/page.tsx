// This page displays the list of posts within a specific forum of a community.
"use client"

import { useState, useEffect } from "react";
import { useAuth } from "../../../_firebase/context.tsx";
import { use } from "react";
import Link from "next/link";
import { fetchPostsByForum, createPost, editPost, deletePostById, votePost } from "./forum.ts";
import styles from "./forumPage.module.css";
import { Post, Forum } from "../../../_types/types.ts";
import { useCallback } from "react";
import NavBar from '../../../_components/navbar/navbar.tsx';
import * as commApi from "../community";
import { Community } from "../../../_types/types.ts";

export default function ForumPage({
    params,
}: {
    params: Promise<{ commName: string; forumSlug: string }>;
}) {
    const { commName, forumSlug } = use(params);
    const { user } = useAuth();
    const [community, setCommunity] = useState<Community | null>(null);
    const [posts, setPosts] = useState<Post[]>([]);
    const [title, setTitle] = useState("");
    const [contents, setContents] = useState("");
    const [editingPostId, setEditingPostId] = useState<string | null>(null);
    const [editTitle, setEditTitle] = useState("");
    const [editContents, setEditContents] = useState("");

    const [forum, setForum] = useState<Forum | null>(null);
    const [loading, setLoading] = useState(true);

    /** Fetch posts by forum
     *  This is used to load posts when the component mounts and after actions like adding, editing, or deleting a post.
     */
    const fetchPosts = useCallback(async () => {
        try {
            const { forum, posts } = await fetchPostsByForum(commName, forumSlug);

            const formattedPosts = (posts || []).map((p: Post) => ({
                ...p,
                timePosted: p.timePosted
                    ? new Date(p.timePosted).toLocaleString()
                    : "Unknown",
            }));

            setForum(forum);
            setPosts(formattedPosts);
        } catch (err) {
            console.error("Failed to fetch forum:", err);
        } finally {
            setLoading(false);
        }
    }, [commName, forumSlug]);

    useEffect(() => {
        fetchPosts();
    }, [commName, forumSlug, fetchPosts]);

    // Handler to add a new post
    const handleAddPost = async () => {
        if (!user) return alert("Sign in to post!");
        if (!title || !contents) return alert("Please fill out title and contents");

        try {
            const msg = await createPost(user.uid, title, contents, commName, forumSlug);
            console.log(msg);
            setTitle("");
            setContents("");
            fetchPosts();
        } catch (err) {
            console.error(err);
        }
    };

    // Handler to save edited post
    const handleSaveEdit = async (postId: string) => {
        try {
            const msg = await editPost(postId, user?.uid, editTitle, editContents);
            console.log(msg);
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

    // Handler to delete a post
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

    // Handler to vote on a post
    const handleVote = async (postId: string, type: "yay" | "nay") => {
        if (!user) return alert("Sign in to vote!");
        try {
            await votePost(postId, user.uid, type);
            fetchPosts();
        } catch (err) {
            console.error(err);
        }
    };

    if (loading) return <div>Loading forum...</div>;
    if (!forum) return <div>Forum not found.</div>;

    return (
        <div className={styles.background}>
            <div className = {styles.navBox}>
                <NavBar/>
            </div>

            <div className = {styles.yourCommunitiesBar}>
                <h1>Your Communities</h1>
                <button className = {styles.communitiesButtons}>
                    <img src = "plus.svg" className = {styles.addIcon}></img>
                    <h1 className = {styles.buttonTextforCommunities}>Add a Community</h1>
                </button>
            </div>

            
            <div className = {styles.serverBar}>
                <div className = {styles.horizontalLine}></div>
                <h1>{commName}</h1>
                <div className = {styles.horizontalLine}></div>
                <div className = {styles.serverContainer}>
                    {/* Stuff Goes Here */}
                </div>
            </div>

            <div className = {styles.channelInfoBox}>
                <div className = {styles.channelInfoh1}>{commName}</div>
                <div className = {styles.channelInfoh2}>{community?.description}</div>
            </div>
            
            <div className = {styles.RightBar}>
                <div className = {styles.horizontalLine}></div>
                <div className = {styles.RulesBar}>
                    Rules
                </div>
            </div>

            <div className = {styles.centerPage}>
                <div className = {styles.bannerBox}></div>
                <div className = {styles.titleBox}>
                    <div className = {styles.serverIcon}></div>
                    <div className = {styles.titleText}>{commName}/{forumSlug}</div>
                </div>
                <div className = {styles.blackLine}> </div>

                <h2 className = {styles.descText}>
                    Description:
                </h2>

                <h2 className = {styles.descText}>
                    {forum.description}
                </h2>

                {/* --- Create New Post Section --- */}
                {user ? (
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
                ) : (
                    <p>Please sign in to create posts.</p>
                )}

                {/* --- Posts List --- */}
                
                <div className = {styles.forumBox}>
                <h2>Forum Posts</h2>
                {posts.length === 0 ? (
                    <p>No posts found in this forum.</p>
                ) : (
                    posts.map((post) => {
                        // Check if the current user is the author of the post
                        const isAuthor = post.authorId === user?.uid;
                        // Check if the post is currently being edited
                        const isEditing = editingPostId === post.id;

                        return (
                            <div key={post.id} className={styles.postCard}>
                                {/* If the post is being edited, show input fields */}
                                {isEditing ? (
                                    <>
                                        {/* Title input */}
                                        <input
                                            value={editTitle}
                                            onChange={(e) => setEditTitle(e.target.value)}
                                            className={styles.input}
                                        />

                                        {/* Contents textarea */}
                                        <textarea
                                            value={editContents}
                                            onChange={(e) => setEditContents(e.target.value)}
                                            className={styles.textarea}
                                        />
                                    
                                        {/* Save button */}
                                        <button
                                            onClick={() => handleSaveEdit(post.id)}
                                            className={`${styles.button} ${styles.saveButton}`}
                                        >
                                            Save
                                        </button>
                                        
                                        {/* Cancel button */}
                                        <button
                                            onClick={cancelEditing}
                                            className={`${styles.button} ${styles.cancelButton}`}
                                        >   
                                            Cancel
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        {/* Post title and contents, linked to the post details page */}
                                        <Link href={`/community/${commName}/${forumSlug}/${post.id}`}>
                                            <h3 className={styles.title}>{post.title}</h3>
                                            <p className={styles.contents}>{post.contents}</p>
                                        </Link>

                                        {/* ---- Post metadata ---- */}
                                        {/* Post author */}
                                        <p className={styles.meta}>
                                            <Link href={`/profile/${post.authorId}`}>
                                                <strong>Author:</strong> {post.authorUsername}
                                            </Link>
                                        </p>

                                        {/* Time post was created, and if it was edited */}
                                        <p className={styles.time}>
                                            {post.timePosted} {post.edited && "(edited)"}
                                        </p>

                                        {/* Yay score and reply count */}
                                        <p className={styles.meta}>
                                            <strong>Yay Score:</strong> {post.yayScore} | <strong>Replies:</strong> {post.replyCount}
                                        </p>

                                        <div className={styles.actions}>
                                            {/* ---- Vote buttons ---- */}
                                            {/* If the user has already voted, show their vote status (green for yay) */}
                                            <button
                                                onClick={() => handleVote(post.id, "yay")}
                                                className={`${styles.voteButton} ${
                                                    post.yayList.includes(user?.uid || "") ? styles.yayActive : ""
                                                }`}
                                            >
                                                👍 Yay
                                            </button>

                                            {/* If the user has already voted, show their vote status (red for nay) */}
                                            <button
                                                onClick={() => handleVote(post.id, "nay")}
                                                className={`${styles.voteButton} ${
                                                    post.nayList.includes(user?.uid || "") ? styles.nayActive : ""
                                                }`}
                                            >
                                                👎 Nay
                                            </button>

                                            {/* If the user is the author of the post, show edit and delete buttons */}
                                            {isAuthor && (
                                                <>
                                                    {/* Edit button */}
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
                                                    
                                                    {/* Delete button */}
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
            </div>  
        </div>
    );
}
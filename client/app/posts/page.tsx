"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../context";

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

    // ---- Fetch Posts ---- //
    const fetchPosts = async () => {
        try {
            const res = await fetch("http://localhost:2400/api/posts/all");
            const data = await res.json();

            const formattedPosts = (data.message || []).map((post: any) => ({
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

    // ---- Add Post ---- //
    const addPost = async () => {
        if (!user) return alert("Sign in to post!");
        if (!title || !contents) return alert("Fill title and contents");

        try {
            const res = await fetch("http://localhost:2400/api/posts/make-post", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ author: user.uid, title, contents }),
            });
            const data = await res.json();
            alert(data.message || "Post added!");
            setTitle("");
            setContents("");
            fetchPosts();
        } catch (err) {
            console.error(err);
        }
    };

    // ---- Edit Post ---- //
    const startEditing = (post: Post) => {
        setEditingPostId(post.id);
        setEditTitle(post.title);
        setEditContents(post.contents);
    };

    const cancelEditing = () => {
        setEditingPostId(null);
        setEditTitle("");
        setEditContents("");
    };

    const saveEdit = async (postId: string) => {
        try {
            const res = await fetch(`http://localhost:2400/api/posts/edit/${postId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title: editTitle,
                    contents: editContents,
                    userId: user?.uid,
                }),
            });
            const data = await res.json();
            alert(data.message || "Post updated!");
            cancelEditing();
            fetchPosts();
        } catch (err) {
            console.error("Failed to edit post:", err);
        }
    };

    // ---- Delete Post ---- //
    const deletePost = async (postId: string) => {
        if (!confirm("Are you sure you want to delete this post?")) return;

        try {
            const res = await fetch(`http://localhost:2400/api/posts/delete/${postId}`, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId: user?.uid }),
            });
            const data = await res.json();
            alert(data.message || "Post deleted!");
            fetchPosts();
        } catch (err) {
            console.error(err);
        }
    };

    // ---- Vote Post ---- //
    const handleVote = async (postId: string, type: "yay" | "nay") => {
        if (!user) return alert("Sign in to vote!");

        try {
            await fetch("http://localhost:2400/api/posts/vote", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ postId, userId: user.uid, type }),
            });
            fetchPosts();
        } catch (err) {
            console.error(err);
        }
    };

    if (loading) return <div>Loading...</div>;
    if (!user) return <div>Sign in to view posts!</div>;

    return (
        <div style={{ padding: "40px", maxWidth: "800px", margin: "0 auto", fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" }}>
            <h1 style={{ textAlign: "center", marginBottom: "30px" }}>Posts Demo</h1>

            <div style={{ marginBottom: "40px" }}>
                <h2>Create New Post</h2>
                <input
                    placeholder="Post Title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    style={{ display: "block", marginBottom: "10px", width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #ccc" }}
                />
                <textarea
                    placeholder="Post Contents"
                    value={contents}
                    onChange={(e) => setContents(e.target.value)}
                    style={{ display: "block", marginBottom: "10px", width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #ccc", minHeight: "100px" }}
                />
                <button
                    onClick={addPost}
                    style={{ padding: "10px 20px", borderRadius: "8px", border: "none", backgroundColor: "#0070f3", color: "#fff", cursor: "pointer" }}
                    onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#005bb5")}
                    onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "#0070f3")}
                >
                    Add Post
                </button>
            </div>

            <h2>All Posts</h2>
            {posts.length === 0 ? (
                <p>No posts found.</p>
            ) : (
                posts.map((post) => {
                    const isAuthor = post.authorId === user.uid;
                    return (
                        <div
                            key={post.id}
                            style={{
                                border: "1px solid #999",
                                borderRadius: "12px",
                                padding: "20px",
                                marginBottom: "20px",
                                boxShadow: "0 4px 8px rgba(0,0,0,0.05)",
                                backgroundColor: "#5B6680",
                                color: "#fff",
                                transition: "transform 0.15s ease",
                                position: "relative",
                            }}
                            onMouseOver={(e) => (e.currentTarget.style.transform = "scale(1.02)")}
                            onMouseOut={(e) => (e.currentTarget.style.transform = "scale(1)")}
                        >
                            {editingPostId === post.id ? (
                                <>
                                    <input
                                        value={editTitle}
                                        onChange={(e) => setEditTitle(e.target.value)}
                                        style={{ width: "100%", padding: "8px", marginBottom: "10px", borderRadius: "6px", border: "1px solid #ccc" }}
                                    />
                                    <textarea
                                        value={editContents}
                                        onChange={(e) => setEditContents(e.target.value)}
                                        style={{ width: "100%", padding: "8px", minHeight: "80px", marginBottom: "10px", borderRadius: "6px", border: "1px solid #ccc" }}
                                    />
                                    <button
                                        onClick={() => saveEdit(post.id)}
                                        style={{ marginRight: "10px", backgroundColor: "#4CAF50", color: "white", padding: "6px 12px", border: "none", borderRadius: "6px", cursor: "pointer" }}
                                        onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#45a049")}
                                        onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "#4CAF50")}
                                    >
                                        Save
                                    </button>
                                    <button
                                        onClick={cancelEditing}
                                        style={{ backgroundColor: "#888", color: "white", padding: "6px 12px", border: "none", borderRadius: "6px", cursor: "pointer" }}
                                        onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#666")}
                                        onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "#888")}
                                    >
                                        Cancel
                                    </button>
                                </>
                            ) : (
                                <>
                                    <h3>{post.title}</h3>
                                    <p>{post.contents}</p>
                                    <p style={{ fontSize: "14px", color: "#ccc" }}>
                                        <strong>Author:</strong> {post.authorUsername}
                                    </p>
                                    <p style={{ fontSize: "14px", color: "#ccc", position: "absolute", top: "20px", right: "20px" }}>
                                        {post.timePosted} {post.edited && "(edited)"}
                                    </p>
                                    <p style={{ fontSize: "14px", color: "#ccc" }}>
                                        <strong>Yay Score:</strong> {post.yayScore}
                                    </p>

                                    <div style={{ marginTop: "10px" }}>
                                        <button
                                            onClick={() => handleVote(post.id, "yay")}
                                            style={{
                                                marginRight: "10px",
                                                backgroundColor: post.yayList.includes(user.uid) ? "#4CAF50" : "#6c757d",
                                                color: "white",
                                                padding: "5px 10px",
                                                border: "none",
                                                borderRadius: "6px",
                                                cursor: "pointer",
                                            }}
                                            onMouseOver={(e) => (e.currentTarget.style.backgroundColor = post.yayList.includes(user.uid) ? "#45a049" : "#5a6268")}
                                            onMouseOut={(e) => (e.currentTarget.style.backgroundColor = post.yayList.includes(user.uid) ? "#4CAF50" : "#6c757d")}
                                        >
                                            👍 Yay
                                        </button>
                                        <button
                                            onClick={() => handleVote(post.id, "nay")}
                                            style={{
                                                backgroundColor: post.nayList.includes(user.uid) ? "#d9534f" : "#6c757d",
                                                color: "white",
                                                padding: "5px 10px",
                                                border: "none",
                                                borderRadius: "6px",
                                                cursor: "pointer",
                                            }}
                                            onMouseOver={(e) => (e.currentTarget.style.backgroundColor = post.nayList.includes(user.uid) ? "#c9302c" : "#5a6268")}
                                            onMouseOut={(e) => (e.currentTarget.style.backgroundColor = post.nayList.includes(user.uid) ? "#d9534f" : "#6c757d")}
                                        >
                                            👎 Nay
                                        </button>

                                        {isAuthor && (
                                            <>
                                                <button
                                                    onClick={() => startEditing(post)}
                                                    style={{ marginLeft: "10px", backgroundColor: "#f0ad4e", color: "white", padding: "5px 10px", border: "none", borderRadius: "6px", cursor: "pointer" }}
                                                    onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#ec971f")}
                                                    onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "#f0ad4e")}
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => deletePost(post.id)}
                                                    style={{ marginLeft: "10px", backgroundColor: "#d9534f", color: "white", padding: "5px 10px", border: "none", borderRadius: "6px", cursor: "pointer" }}
                                                    onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#c9302c")}
                                                    onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "#d9534f")}
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
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../context";

type Post = {
    id: string;
    title: string;
    contents: string;
    authorUsername: string;
    yayScore: number;
    timePosted: string; // formatted timestamp
};

export default function PostsPage() {
    const { user, userData, loading } = useAuth();
    const [posts, setPosts] = useState<Post[]>([]);
    const [title, setTitle] = useState("");
    const [contents, setContents] = useState("");

    // Fetch all posts
    useEffect(() => {
        const fetchPosts = async () => {
        try {
            const res = await fetch("http://localhost:2400/api/posts/all");
            const data = await res.json();

            // Convert Firestore Timestamp to readable string
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
        fetchPosts();
    }, []);

    // Add a new post
    const addPost = async () => {
        if (!user || !userData) {
        alert("You must be signed in to post!");
        return;
        }
        if (!title || !contents) {
        alert("Please fill title and contents");
        return;
        }

        try {
            const res = await fetch("http://localhost:2400/api/posts/make-post", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                author: user.uid,
                title,
                contents,
                }),
            });
            const data = await res.json();
            alert(data.message || "Post added!");
            setTitle("");
            setContents("");

            // Refresh posts
            const refreshed = await fetch("http://localhost:2400/api/posts/all");
            const refreshedData = await refreshed.json();
            const formattedPosts = (refreshedData.message || []).map((post: any) => ({
                ...post,
                timePosted: post.timePosted
                    ? new Date(post.timePosted).toLocaleString()
                    : "Unknown",
            }));
            setPosts(formattedPosts);
        } catch (err) {
        console.error("Failed to add post:", err);
        }
    };

    if (loading) return <div>Loading...</div>;
    if (!user || !userData) return <div>You must be signed in to view posts!</div>;

    return (
        <div style={{ padding: "40px", fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif", maxWidth: "800px", margin: "0 auto" }}>
        <h1 style={{ textAlign: "center", marginBottom: "30px" }}>Posts Demo (Signed-in User)</h1>

        <div style={{ marginBottom: "40px" }}>
            <h2 style={{ marginBottom: "15px" }}>Create New Post</h2>
            <input
            placeholder="Post Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={{
                display: "block",
                marginBottom: "15px",
                width: "100%",
                padding: "10px",
                fontSize: "16px",
                borderRadius: "8px",
                border: "1px solid #ccc",
                boxSizing: "border-box",
            }}
            />
            <textarea
            placeholder="Post Contents"
            value={contents}
            onChange={(e) => setContents(e.target.value)}
            style={{
                display: "block",
                marginBottom: "15px",
                width: "100%",
                padding: "10px",
                fontSize: "16px",
                borderRadius: "8px",
                border: "1px solid #ccc",
                boxSizing: "border-box",
                minHeight: "100px",
            }}
            />
            <button
            onClick={addPost}
            style={{
                padding: "10px 20px",
                fontSize: "16px",
                borderRadius: "8px",
                border: "none",
                backgroundColor: "#0070f3",
                color: "#fff",
                cursor: "pointer",
                transition: "background-color 0.2s ease",
            }}
            onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#005bb5")}
            onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "#0070f3")}
            >
            Add Post
            </button>
        </div>

        <h2 style={{ marginBottom: "20px" }}>All Posts</h2>
        {posts.length === 0 ? (
            <p>No posts found.</p>
        ) : (
            posts.map((post) => (
            <div
                key={post.id}
                style={{
                border: "1px solid #999",
                borderRadius: "12px",
                padding: "20px",
                marginBottom: "20px",
                boxShadow: "0 4px 8px rgba(0,0,0,0.05)",
                backgroundColor: "#5B6680",
                transition: "transform 0.1s ease",
                position: "relative",
                }}
                onMouseOver={(e) => (e.currentTarget.style.transform = "scale(1.01)")}
                onMouseOut={(e) => (e.currentTarget.style.transform = "scale(1)")}
            >
                <h3 style={{ marginBottom: "10px", color: "#eee" }}>{post.title}</h3>
                <p style={{ marginBottom: "10px" }}>{post.contents}</p>
                <p style={{ fontSize: "14px", color: "#ccc" }}>
                <strong>Author:</strong> {post.authorUsername}
                </p>
                <p style={{ fontSize: "14px", color: "#ccc", position: "absolute", top: "20px", right: "20px" }}>
                {post.timePosted}
                </p>
                <p style={{ fontSize: "14px", color: "#ccc" }}>
                <strong>Yay Score:</strong> {post.yayScore}
                </p>
            </div>
            ))
        )}
        </div>
    );
}
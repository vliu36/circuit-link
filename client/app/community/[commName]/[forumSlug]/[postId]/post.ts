"use client";

import { useState, useEffect } from "react";

export type Reply = {
    id: string;
    contents: string;
    authorUsername: string;
    authorId: string;
    yayScore: number;
    yayList: string[];
    nayList: string[];
    listOfReplies: Reply[];
    timeReply: string;
    edited: boolean;
};

export type Post = {
    id: string;
    title: string;
    contents: string;
    authorUsername: string;
    authorId: string;
    yayScore: number;
    yayList: string[];
    nayList: string[];
    listOfReplies: Reply[];
    timePosted: string;
    edited: boolean;
};

export const useReplies = (postId: string, userId?: string) => {
    const [post, setPost] = useState<Post | null>(null);
    const [loading, setLoading] = useState(true);
    const BASE_URL = "https://api-circuit-link-160321257010.us-west2.run.app/api";

    // --- Fetch post and its replies ---
    const fetchPost = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${BASE_URL}/posts/get/${postId}`);
            const data = await res.json();
            const p: Post = data.message;

            const formatReplies = (replies: Reply[] = []): Reply[] =>
                replies.map((r) => ({
                    ...r,
                    timeReply: r.timeReply ? new Date(r.timeReply).toLocaleString() : "Unknown",
                    listOfReplies: r.listOfReplies ? formatReplies(r.listOfReplies) : [],
                }));

            setPost({
                ...p,
                timePosted: p.timePosted ? new Date(p.timePosted).toLocaleString() : "Unknown",
                listOfReplies: formatReplies(p.listOfReplies || []),
            });
        } catch (err) {
            console.error("Failed to fetch post:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (postId) fetchPost();
    }, [postId]);

    // --- Voting ---
    const handleVote = async (id: string, type: "yay" | "nay", isReply = false) => {
        if (!userId) return;

        setPost((prev) => {
            if (!prev) return prev;

            // Helper to update yay/nay lists
            const updateVoteLists = (yayList: string[], nayList: string[]) => {
                let newYayList = [...yayList];
                let newNayList = [...nayList];
                
                // Toggle vote
                if (type === "yay") {
                    // Remove from yayList if already voted
                    if (yayList.includes(userId)) newYayList = newYayList.filter((u) => u !== userId);
                    // Otherwise, add to yayList and remove from nayList
                    else {
                        newYayList.push(userId);
                        newNayList = newNayList.filter((u) => u !== userId);
                    }
                } else {
                    // Remove from nayList if already voted
                    if (nayList.includes(userId)) newNayList = newNayList.filter((u) => u !== userId);
                    // Otherwise, add to nayList and remove from yayList
                    else {
                        newNayList.push(userId);
                        newYayList = newYayList.filter((u) => u !== userId);
                    }
                }
                return { newYayList, newNayList };
            };

            // Recursive function to update votes in replies
            const updateReplies = (replies: Reply[]): Reply[] =>
                // Map through each reply and update its votes
                replies.map((r) => {
                    if (r.id === id) {
                        const { newYayList, newNayList } = updateVoteLists(r.yayList, r.nayList);
                        return { ...r, yayList: newYayList, nayList: newNayList, yayScore: newYayList.length - newNayList.length };
                    }
                    return { ...r, listOfReplies: updateReplies(r.listOfReplies) };
                });
                if (isReply) return { ...prev, listOfReplies: updateReplies(prev.listOfReplies) };

                const { newYayList, newNayList } = updateVoteLists(prev.yayList, prev.nayList);
                return { ...prev, yayList: newYayList, nayList: newNayList, yayScore: newYayList.length - newNayList.length };
        });

        try {
            await fetch(isReply ? `${BASE_URL}/replies/vote` : `${BASE_URL}/posts/vote`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id, userId, type }),
            });
            fetchPost();
        } catch (err) {
            console.error("Vote failed:", err);
            fetchPost();
        }
    };

    // --- Add reply ---
    const addReply = async (parentId: string, contents: string, isReply = false) => {
        if (!userId || !contents.trim()) return;

        try {
            // Create the reply
            const res = await fetch(`${BASE_URL}/replies/`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ author: userId, contents, postId }),
            });
            const data = await res.json();
            const newReplyId = data.docId;
            if (!newReplyId) throw new Error("Reply ID not returned");

            // Attach reply to parent (post or another reply)
            const patchUrl = isReply
                ? `${BASE_URL}/replies/reply/${parentId}`   // replyToReply
                : `${BASE_URL}/posts/reply/${parentId}`;   // replyToPost
                
            await fetch(patchUrl, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ replyId: newReplyId }),
            });

            // Refresh post data
            fetchPost();
        } catch (err) {
            console.error("Failed to add reply:", err);
        }
    };

    // --- Edit reply ---
    const editReply = async (replyId: string, userId: string | undefined, contents: string) => {
        const res = await fetch(`${BASE_URL}/replies/edit/${replyId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ contents, userId }),
        });
        const data = await res.json();
        return data.message || "Reply updated!";
    };

    // --- Delete reply ---
    const deleteReplyById = async (replyId: string, userId: string | undefined) => {
        const res = await fetch(`${BASE_URL}/replies/delete/${replyId}`, {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId }),
        });
        const data = await res.json();
        return data.message || "Reply deleted!";
    };

    // --- Edit post ---
    const editPost = async (postId: string, userId: string | undefined, title: string, contents: string) => {
        const res = await fetch(`${BASE_URL}/posts/edit/${postId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title, contents, userId }),
        });
        const data = await res.json();
        return data.message || "Post updated!";
    };

    // --- Delete post ---
    const deletePostById = async (postId: string, userId: string | undefined) => {
        const res = await fetch(`${BASE_URL}/posts/delete/${postId}`, {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId }),
        });
        const data = await res.json();
        return data.message || "Post deleted!";
    };

    return { post, handleVote, addReply, loading, editReply, deleteReplyById, editPost, deletePostById, fetchPost };
};
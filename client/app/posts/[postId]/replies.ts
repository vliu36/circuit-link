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
    edited?: boolean;
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
};

export const useReplies = (postId: string, userId?: string) => {
    const [post, setPost] = useState<Post | null>(null);
    const [loading, setLoading] = useState(true);



    const fetchPost = async () => {
        setLoading(true);
        try {
            const res = await fetch(`http://localhost:2400/api/posts/get/${postId}`);
            const data = await res.json();
            const p: Post = data.message;

            const formatReplies = (replies: Reply[]): Reply[] =>
                replies.map((r) => {
                    return {
                        ...r,
                        timeReply: r.timeReply ? new Date(r.timeReply).toLocaleString() : "Unknown",
                        listOfReplies: r.listOfReplies ? formatReplies(r.listOfReplies) : [],
                    };
                });


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

    const handleVote = async (id: string, type: "yay" | "nay", isReply = false) => {
        if (!userId) return;
        const userStr = String(userId);

        // Optimistic update
        setPost((prev) => {
            if (!prev) return prev;

            const updateVoteLists = (yayList: string[], nayList: string[]) => {
                let newYayList = [...yayList];
                let newNayList = [...nayList];

                if (type === "yay") {
                    if (yayList.includes(userStr)) newYayList = newYayList.filter(u => u !== userStr);
                    else {
                        newYayList.push(userStr);
                        newNayList = newNayList.filter(u => u !== userStr);
                    }
                } else {
                    if (nayList.includes(userStr)) newNayList = newNayList.filter(u => u !== userStr);
                    else {
                        newNayList.push(userStr);
                        newYayList = newYayList.filter(u => u !== userStr);
                    }
                }
                return { newYayList, newNayList };
            };

            const updateReplies = (replies: Reply[]): Reply[] =>
                replies.map(r => {
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
            await fetch(isReply ? `http://localhost:2400/api/replies/vote` : `http://localhost:2400/api/posts/vote`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id, userId, type }),
            });
            fetchPost(); // Sync with backend
        } catch (err) {
            console.error("Vote failed:", err);
            fetchPost();
        }
    };

    const addReply = async (parentId: string, contents: string, isReply = false) => {
        if (!userId || !contents.trim()) return;

        try {
            const res = await fetch(`http://localhost:2400/api/replies/`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ author: userId, contents }),
            });
            const data = await res.json();
            const newReplyId = data.docId;

            const patchUrl = isReply
                ? `http://localhost:2400/api/replies/reply/${parentId}`
                : `http://localhost:2400/api/posts/reply/${parentId}`;

            await fetch(patchUrl, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ replyId: newReplyId }),
            });

            fetchPost();
        } catch (err) {
            console.error("Failed to add reply:", err);
        }
    };

    return { post, handleVote, addReply, loading };
};
"use client";

import { useEffect, useState, use } from "react";
import { sendMessage, getMessages, getMediaUrl } from "@/app/_utils/messaging.ts";
import { useAuth } from "@/app/_firebase/context";
import Image from "next/image";
import { Community, Message } from "@/app/_types/types";
import { fetchStructure } from "../community";
import Styles from "./chat.module.css";

export default function CommunityChat({
    params,
}: {
    params: Promise<{ commName: string }>;
}) {
    const { commName } = use(params);
    const { user } = useAuth();
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(true);
    const [newText, setNewText] = useState("");
    const [mediaFile, setMediaFile] = useState<File | null>(null);
    const [mediaPreview, setMediaPreview] = useState<string | null>(null);
    const [community, setCommunity] = useState<Community | null | undefined>(undefined);

    // Load initial messages
    useEffect(() => {
        async function fetchMessages() {
            const now = new Date();
            const data = await getMessages(commName, 0, now);
            setMessages(data.posts || []);
            setLoading(false);
        }
        fetchMessages();
        const interval = setInterval(fetchMessages, 5000);
        return () => clearInterval(interval);
    }, [commName]);

    // Load community structure
    useEffect(() => {
        async function loadCommunity() {
            const updated = await fetchStructure(commName);
            setCommunity(updated);
        }
        loadCommunity();
    }, [commName]);

    // Refresh the current community structure and update state
    const refreshCommunity = async () => {
        try {
            const updated = await fetchStructure(commName);
            if (updated) {
                setCommunity(updated);
            } else {
                console.log("Failed to refresh community: no data returned");
            }
        } catch (err) {
            console.log("Error refreshing community:", err);
        }
    };

    // Handle sending messages
    async function handleSend() {
        if (!newText.trim() && !mediaFile) return;
        if (!user) return;

        let mediaUrl = null;
        if (mediaFile) {
            const uploaded = await getMediaUrl(mediaFile);
            mediaUrl = uploaded?.media || null;
        }

        const newMsg = {
            authorId: user.uid,
            authorName: user.displayName || "Unknown",
            authorIcon: user.photoURL || "/default-profile.png",
            contents: newText.trim(),
            media: mediaUrl,
            timestamp: new Date().toISOString(),
        };

        setMessages((prev) => [...prev, newMsg]);

        await sendMessage(user.uid, newText.trim(), mediaUrl, commName, 0);

        setNewText("");
        setMediaFile(null);
        setMediaPreview(null);

        const now = new Date();
        const data = await getMessages(commName, 0, now);
        setMessages(data.posts || []);
    }

    function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0] || null;
        setMediaFile(file);

        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => setMediaPreview(reader.result as string);
            reader.readAsDataURL(file);
        } else {
            setMediaPreview(null);
        }
    }

    if (!community) {
        return (
            <div className={Styles.chatPage}>
                <h1 className={Styles.chatTitle}>Loading community...</h1>
            </div>
        );
    }
    if (community === null) {
        return (
            <div className={Styles.chatPage}>
                <h1 className={Styles.chatTitle}>
                    Community {commName} not found.
                </h1>
            </div>
        );
    }

    const isMember = community?.userList.some(m => m.id === user?.uid);

    if (!isMember) {
        return (
            <div className={Styles.chatPage}>
                <h1 className={Styles.chatTitle}>
                    You must be a member of {commName} to access the chat.
                </h1>
            </div>
        );
    }

    return (
        <div className={Styles.chatPage}>
            {/* Header */}
            <div className={Styles.chatHeader}>
                <h1 className={Styles.chatTitle}>
                    Community Chat: {commName}
                </h1>

                <button
                    onClick={() => window.history.back()}
                    className={Styles.returnButton}
                >
                    Return to Forums
                </button>
            </div>

            {/* Messages */}
            <div className={Styles.messagesBox}>
                {loading ? (
                    <p>Loading messages...</p>
                ) : messages.length === 0 ? (
                    <p>No messages yet.</p>
                ) : (
                    <ul className="space-y-3">
                        {messages.map((msg, index) => (
                            <li key={index} className={Styles.messageItem}>
                                <Image
                                    src={msg.authorIcon || "/default-profile.png"}
                                    alt={msg.authorName || "Unknown"}
                                    width={40}
                                    height={40}
                                    className={Styles.messageAvatar}
                                />
                                <p className={Styles.messageAuthor}>
                                    {msg.authorName || "Unknown"}
                                </p>
                                <p>{msg.contents}</p>
                                <p className={Styles.messageTimestamp}>
                                    {new Date(msg.timestamp).toLocaleString()}
                                </p>

                                {msg.media && (
                                    <div>
                                        <Image
                                            src={msg.media}
                                            alt="Media content"
                                            width={200}
                                            height={200}
                                        />
                                    </div>
                                )}
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            {/* Input Row */}
            <div className={Styles.chatInputRow}>
                <input
                    type="text"
                    className={Styles.chatTextInput}
                    value={newText}
                    onChange={(e) => setNewText(e.target.value)}
                    placeholder={`Message ${commName}...`}
                    maxLength={512}
                />

                <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className={Styles.chatFileInput}
                />

                <button
                    onClick={handleSend}
                    className={Styles.sendButton}
                >
                    Send
                </button>
            </div>

            {/* Media Preview */}
            {mediaPreview && (
                <div className={Styles.mediaPreviewBox}>
                    <p className={Styles.mediaPreviewLabel}>Preview:</p>
                    <Image
                        src={mediaPreview}
                        alt="Preview"
                        width={200}
                        height={200}
                        className={Styles.mediaPreviewImage}
                    />
                </div>
            )}
        </div>
    );
}
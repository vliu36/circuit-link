"use client";

import { useEffect, useState, use } from "react";
import { sendMessage, getMessages, getMediaUrl } from "@/app/_utils/messaging.ts";
import { useAuth } from "@/app/_firebase/context";
import Image from "next/image";
import Link from "next/link";
import { fetchUserById, OtherUserData } from "../userProfile";
import { Message } from "@/app/_types/types";
import Styles from "./dms.module.css";

export default function CommunityChat({ params }: { params: Promise<{ uid: string }> }) {
    const { uid } = use(params);
    const { user } = useAuth();
    const [messages, setMessages] = useState<Message[] | null>(null);
    const [loadingUser, setLoadingUser] = useState(true);
    const [loadingMessages, setLoadingMessages] = useState(true);
    const [newText, setNewText] = useState("");
    const [mediaFile, setMediaFile] = useState<File | null>(null);
    const [mediaPreview, setMediaPreview] = useState<string | null>(null);
    const [otherId, setOtherId] = useState<string | null>(null);
    const [other, setOther] = useState<OtherUserData | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const resolveUidAndFetch = async () => {
            const { uid } = await params;
            if (!uid) {
                setError("No UID provided");
                setLoadingUser(false);
                return;
            }
            setOtherId(uid);

            try {
                const data = await fetchUserById(uid);
                if (!data) setError("User not found");
                setOther(data);
            } catch (err) {
                setError("Error fetching user profile: " + err);
                console.log(err);
                setOther(null);
            } finally {
                setLoadingUser(false);
            }
        };
        resolveUidAndFetch();
    }, [params]);

    useEffect(() => {
        if (!otherId || !user) return;

        async function fetchMessages() {
            const now = new Date();
            const data = await getMessages(otherId!, 1, now, user?.uid);
            setMessages(data.posts || []);
            setLoadingMessages(false);
        }

        fetchMessages();
        const interval = setInterval(fetchMessages, 5000);
        return () => clearInterval(interval);
    }, [otherId, user]);

    async function handleSend() {
        if (!newText.trim() && !mediaFile) return;
        if (!user || !otherId) return;

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

        setMessages((prev) => [...(prev || []), newMsg]);

        await sendMessage(user.uid, newText.trim(), mediaUrl, otherId, 1);

        setNewText("");
        setMediaFile(null);
        setMediaPreview(null);
    }

    function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0] || null;
        setMediaFile(file);

        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => setMediaPreview(reader.result as string);
            reader.readAsDataURL(file);
        } else setMediaPreview(null);
    }

    return (
        <div className={Styles.dmPage}>
            <div className={Styles.dmHeader}>
                <h1 className={Styles.dmTitle}>
                    Direct Messages: {other?.user?.username || "Loading..."}
                </h1>
                <button onClick={() => window.history.back()} className={Styles.returnButton}>
                    Return to Profile
                </button>
            </div>

            <div className={Styles.messagesBox}>
                {messages === null ? (
                    <p>Loading messages...</p>
                ) : messages.length === 0 ? (
                    <p>No messages yet.</p>
                ) : (
                    <ul>
                        {messages.map((msg, index) => (
                            <li key={index} className={Styles.messageItem}>
                                <Image
                                    src={msg.authorIcon || "/default-profile.png"}
                                    alt="Profile picture"
                                    width={40}
                                    height={40}
                                    className={Styles.messageAvatar}
                                />
                                <p className={Styles.messageAuthor}>{msg.authorName}</p>
                                <p>{msg.contents}</p>
                                <p className={Styles.messageTimestamp}>
                                    {new Date(msg.timestamp).toLocaleString()}
                                </p>

                                {msg.media && (
                                    <div>
                                        <Image src={msg.media} alt="Media" width={200} height={200} />
                                    </div>
                                )}
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            <div className={Styles.inputRow}>
                <input
                    type="text"
                    className={Styles.textInput}
                    value={newText}
                    onChange={(e) => setNewText(e.target.value)}
                    placeholder={`Message ${other?.user?.username || "User"}...`}
                    maxLength={512}
                />

                <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className={Styles.fileInput}
                />

                <button onClick={handleSend} className={Styles.sendButton}>
                    Send
                </button>
            </div>

            {mediaPreview && (
                <div className={Styles.previewBox}>
                    <p className={Styles.previewLabel}>Preview:</p>
                    <Image
                        src={mediaPreview}
                        alt="Preview"
                        width={200}
                        height={200}
                        className={Styles.previewImage}
                    />
                </div>
            )}
        </div>
    );
}
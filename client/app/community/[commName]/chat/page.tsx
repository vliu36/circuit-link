"use client";

import { useEffect, useState, use } from "react";
import { sendMessage, getMessages, getMediaUrl } from "@/app/_utils/messaging.ts";
import { useAuth } from "@/app/_firebase/context";
import Image from "next/image";
import { Community, Message } from "@/app/_types/types";
import { fetchStructure } from "../community";

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
                // TODO: This causes an error when changing the community name; refreshing returns no data because the old name is used
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

        // const time = Date.now();

        // Create message object for optimistic UI update
        const newMsg = {
            authorId: user.uid,
            authorName: user.displayName || "Unknown",
            authorIcon: user.photoURL || "/default-profile.png",
            contents: newText.trim(),
            media: mediaUrl,
            timestamp: new Date().toISOString(),
        }

        // Optimistically add message to UI
        setMessages((prevMessages) => [...prevMessages, newMsg]);
        // Send message to backend
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
            <div className="flex flex-col h-screen p-4">
                <h1 className="text-xl font-bold text-black">
                    Loading community...
                </h1>
            </div>
        );
    }
    if (community === null) {
        return (
            <div className="flex flex-col h-screen p-4">
                <h1 className="text-xl font-bold text-black">
                    Community {commName} not found.
                </h1>
            </div>
        );
    }

    const isMember = community?.userList.some(m => m.id === user?.uid);

    if (!isMember) {
        return (
            <div className="flex flex-col h-screen p-4">
                <h1 className="text-xl font-bold text-black">
                    You must be a member of {commName} to access the chat.
                </h1>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-screen p-4">
            <div className="flex items-center gap-3 mb-4">
                <h1 className="text-xl font-bold text-black">
                    Community Chat: {commName}
                </h1>
                <button onClick={() => window.history.back()} className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600">
                    Return to Forums
                </button>
            </div>

            {/* Messages list */}
            <div className="flex-1 overflow-y-auto border rounded p-3 bg-white text-black">
            {loading ? (
                <p>Loading messages...</p>
            ) : messages.length === 0 ? (
                <p>No messages yet.</p>
            ) : (
                <ul className="space-y-3">
                {messages.map((msg, index) => (
                    <li key={index} className="p-2 bg-gray-100 rounded">
                    <Image
                        src={msg.authorIcon || "/default-profile.png"}
                        alt={msg.authorName || "Unknown"}
                        width={40}
                        height={40}
                        className="rounded-full"
                    />
                    <p className="text-sm font-semibold">{msg.authorName || "Unknown"}</p>
                    <p>{msg.contents}</p>
                    <p className="text-xs text-gray-500">
                        {new Date(msg.timestamp).toLocaleString()}
                    </p>
                    {msg.media && (
                        <div className="mt-2">
                        <Image src={msg.media} alt="Media content" width={200} height={200} />
                        </div>
                    )}
                    </li>
                ))}
                </ul>
            )}
            </div>

            {/* Input bar */}
            <div className="flex mt-4 gap-2 items-center">
            <input
                type="text"
                className="flex-1 border rounded p-2"
                value={newText}
                onChange={(e) => setNewText(e.target.value)}
                placeholder={`Message ${commName}...`}
                style={{ color: "black" }}
                maxLength={512}
            />
            <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="border rounded p-2 bg-sky-300 text-gray-600 hover:bg-sky-400 cursor-pointer"
            />
            <button
                onClick={handleSend}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
                Send
            </button>
            </div>

            {/* Preview */}
            {mediaPreview && (
            <div className="mt-2">
                <p className="text-sm text-gray-500">Preview:</p>
                <Image src={mediaPreview} alt="Preview" width={200} height={200} className="rounded" />
            </div>
            )}
        </div>
    );
}
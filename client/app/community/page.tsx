// This page is for creating a community.
"use client";

import React, { useState } from "react";
import { createCommunity } from "./commCreate";
import { useRouter } from "next/navigation";

export default function CommunityCreatePage() {
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [isPublic, setIsPublic] = useState(true);
    const [message, setMessage] = useState("");

    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const res = await createCommunity(name, description, isPublic);

            if (res.status === "ok") {
                setMessage(`Community "${name}" created successfully!`);
                const cleanName = res.commName;
                router.push(`/community/${cleanName}`);
            } else {
                setMessage(res.message || "Failed to create community.");
            }
        } catch (err) {
            console.error(err);
            setMessage("Error connecting to backend.");
        }
    };

    return (
        <div>
            <h1>Create a Community</h1>
            <form onSubmit={handleSubmit}>
                <label>
                    Name: <br />
                    <input
                        type="text"
                        value={name}
                        maxLength={24} 
                        pattern="^[a-zA-Z0-9_-]+$"
                        title="24 characters max. Name can only contain letters, numbers, underscores, and hyphens."
                        onChange={(e) => setName(e.target.value)}
                        required
                    />
                </label>
                <br /><br />

                <label>
                    Description: <br />
                    <textarea
                        value={description}
                        maxLength={100} 
                        title="100 characters max."
                        onChange={(e) => setDescription(e.target.value)}
                        required
                    />
                </label>
                <br /><br />

                <label>
                    Public:{" "}
                    <input
                        type="checkbox"
                        checked={isPublic}
                        onChange={(e) => setIsPublic(e.target.checked)}
                    />
                </label>
                <br /><br />

                <button type="submit">Create</button>
            </form>

            {message && (
                <>
                    <br />
                    <p>{message}</p>
                </>
            )}
        </div>
    );
}
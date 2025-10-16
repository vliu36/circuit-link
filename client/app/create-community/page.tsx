"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CreateCommunityPage() {
    const [name, setName] = useState("");
    const router = useRouter();
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        /* I think this is how you convert the URL to something that works with slug*/
        const slug = name.toLowerCase().replace(/\s+/g, '-');

        /* Redirect to a dynamic community page */
        router.push('/community/${encodedURLComponent(slug)}');
    };

    return (
        <div style={{ padding: "2px"}}>
        <h1 style={{ fontSize: "32px", marginBottom: "20px" }}>Create A Community</h1>
        <form onSubmit={handleSubmit}>
        <input
        type="text"
        placeholder="Community name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
        style={{
            padding: "10px",
            fontSize: "16px",
            width: "300px",
            marginBottom: "20px",
            borderRadius: "8px",
            border: "1px solid",
        }}
    />
    <br />
    <button
    type="submit"
    style={{
        padding: "10px 20px",
        fontSize: "16px",
        backgroundColor: "grey",
        color: "white",
        border: "none",
        borderRadius: "8px",
        cursor: "pointer",
    }}
    ></button>
    </form>
    </div>
    );
}
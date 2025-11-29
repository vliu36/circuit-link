"use client";

import { useState } from "react";
import Styles from "./communities.module.css";
import { createCommunity } from "./commCreate"; 
import { useRouter } from "next/navigation";

interface PopupProps {
    onClose: () => void;
}

export default function CreateCommunityPopup({ onClose }: PopupProps) {
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [isPublic, setIsPublic] = useState(true);
    const [message, setMessage] = useState("");

    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        e.stopPropagation();

        try {
            const namePattern = /^[a-zA-Z0-9_-]{1,24}$/;
            if (!namePattern.test(name)) {
                setMessage("Name must be 1–24 characters, letters, numbers, _ or -");
                return;
            }

            const res = await createCommunity(name, description, isPublic);
            if (res.status === "ok") {
                const cleanName = res.commName;
                onClose();            // close popup
                router.push(`/community/${cleanName}`); // go to new community
            } else {
                setMessage(res.message || "Failed to create community.");
            }
        } catch {
            setMessage("Error connecting to backend.");
        }
    };

    return (
        <div className={Styles.popupOverlay} onClick={onClose}>
            <div className={Styles.popupBox} onClick={(e) => e.stopPropagation()}>
                <h2>Create a Community</h2>

                <form onSubmit={handleSubmit} className={Styles.popupAlignment}>
                    <label className={Styles.popupText}>
                        Name:
                        <input
                            className={Styles.inputBox}
                            type="text"
                            value={name}
                            maxLength={24}
                            onChange={(e) => setName(e.target.value)}
                            required
                        />
                    </label>

                    <label className={Styles.descText}>
                        <h1>Description:</h1>
                        <textarea
                            className={Styles.inputBox}
                            value={description}
                            maxLength={100}
                            onChange={(e) => setDescription(e.target.value)}
                            required
                        />
                    </label>

                    <label className={Styles.isPublicBox}>
                        <h1>Public:</h1>
                        <input
                            type="checkbox"
                            checked={isPublic}
                            onChange={(e) => setIsPublic(e.target.checked)}
                        />
                    </label>

                    <button type="submit" className={Styles.saveBtn}>
                        Create
                    </button>
                    <button type="button" className={Styles.closeBtn} onClick={onClose}>
                        Cancel
                    </button>

                    {message && <p className={Styles.popupText}>{message}</p>}
                </form>
            </div>
        </div>
    );
}
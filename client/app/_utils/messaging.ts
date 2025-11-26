// Helper functions for message handling in the frontend

import { uploadImage } from "./mediaUpload";

const SERVER_URI = "http://localhost:2400/api/messages";

// Calls backend to create and send messages
export async function sendMessage(author: string, contents: string, media: string | null, receiver: string, isDirect: number ) {
    const res = await fetch(`${SERVER_URI}/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ author, contents, media, receiver, isDirect })
    });
    const data = await res.json();
    return data.message;
}

// Retrieves messages up to given time
export async function getMessages(
    receiver: string, // The other user or community being messaged
    isDirect: number, // 1 for direct message, 0 for community
    time: Date, 
    sender: string | null = null // Optional sender ID for filtering, this is the current user
) {
    const encodedTime = encodeURIComponent(time.toISOString());
    const res = await fetch(`${SERVER_URI}/getBefore/${receiver}/${isDirect}/${encodedTime}/${sender}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
    });

    const data = await res.json();

    return {
        posts: data.messages,
    };
}

// Upload media file and get its URL
export async function getMediaUrl(mediaFile: File | null) {
    let fileName: string | null = null;
    let mediaUrl = "https://storage.googleapis.com/circuit-link.firebasestorage.app/"
    try {
        if (mediaFile) {
            if (mediaFile.type.startsWith("image/")) {
                fileName = await uploadImage(mediaFile) as string;
                mediaUrl += `images/${fileName}`;
            // } else if (mediaFile.type.startsWith("video/")) {
            //     fileName = await uploadVideo(mediaFile) as string;
            //     mediaUrl += `videos/${fileName}`;
            } else {
                alert("Unsupported media type. Please upload an image or video.");
                return { status: "error", message: "Unsupported media type.", media: null };
            } // end if else
        } else {
            return { status: "no_media", message: "No media file provided.", media: null }; // No media file provided
        } // end if else
        return { status: "ok", message: "Media uploaded successfully.", media: mediaUrl };
    } catch (err) {
        console.error("Media upload failed:", err);
        return { status: "error", message: "Media upload failed.", media: null };
    }
}
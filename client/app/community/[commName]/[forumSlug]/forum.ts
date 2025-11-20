import { uploadImage, uploadVideo } from "@/app/_utils/mediaUpload";

const BASE_URL = "http://localhost:2400/api";

// Fetch posts belonging to a specific forum
export async function fetchPostsByForum(commName: string, forumSlug: string, sortMode: string) {
    const res = await fetch(`${BASE_URL}/forums/get/${commName}/${forumSlug}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sortMode }),
    });

    // Defensive: handle non-JSON or errors
    if (!res.ok) {
        const text = await res.text();
        throw new Error(`Backend error ${res.status}: ${text}`);
    }

    const data = await res.json();

    // Ensure structure matches your backend
    if (data.status !== "OK") {
        throw new Error(data.message || "Unexpected backend format");
    }

    // Return the inner forum and posts
    return {
        forum: data.forum,
        posts: data.posts,
    };
}

export async function createPost(
    // ! author: string, DEPRECATED - now derived from session cookie
    title: string,
    contents: string,
    commName: string,
    forumSlug: string,
    media: string | null = null
) {
    const res = await fetch(`${BASE_URL}/posts/make-post`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, contents, commName, forumSlug, media }),
        credentials: "include",
    });
    const data = await res.json();
    return data.message || "Post added!";
}

export async function editPost(postId: string, title: string, contents: string) {
    const res = await fetch(`${BASE_URL}/posts/edit/${postId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, contents }),
        credentials: "include",
    });
    const data = await res.json();
    return data.message || "Post updated!";
}

export async function deletePostById(postId: string, commName: string) {
    const res = await fetch(`${BASE_URL}/posts/delete/${postId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ commName }),
        credentials: "include",
    });
    const data = await res.json();
    return data.message || "Post deleted!";
}

export async function votePost(id: string, type: "yay" | "nay") {
    await fetch(`${BASE_URL}/posts/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, type }),
        credentials: "include",
    });
}

// Edit forum 
export async function editForum(
    forumId: string, 
    name?: string, 
    description?: string
): Promise<{ status: string; message: string, newSlug?: string }> {
    try {
        const res = await fetch(`${BASE_URL}/forums/edit/${forumId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, description }),
            credentials: "include",
        });
        const data = await res.json();
        if (!res.ok) {
            return { status: "error", message: data.message || "Failed to edit forum.", newSlug: "" };
        }
        return { status: "ok", message: data.message || "Forum updated!", newSlug: data.newSlug || "" };
    } catch (error) {
        return { status: "error", message: "Failed to edit forum.", newSlug: ""};
    }
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
            } else if (mediaFile.type.startsWith("video/")) {
                fileName = await uploadVideo(mediaFile) as string;
                mediaUrl += `videos/${fileName}`;
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

// Report a post
export async function reportPost(
    commName: string,
    postId: string,
    reason: string
) {
    try {
        const res = await fetch(`${BASE_URL}/comm/report-post`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ commName, postId, reason }),
            credentials: "include",
        });
        const data = await res.json();
        if (!res.ok) {
            return { status: "error", message: data.message || "Failed to report post." };
        }
        return { status: "ok", message: data.message || "Post reported successfully." };
    } catch (error) {
        return { status: "error", message: "Failed to report post." };
    } // end try catch
} // end function reportPost

export async function searchPosts(commName: string, slug: string, query: string) {
    const res = await fetch(
        `${BASE_URL}/forums/search/${commName}/${slug}/${encodeURIComponent(query)}`,
        {
            method: "GET",
            headers: { "Content-Type": "application/json" }
        }
    );

    if (!res.ok) {
        const text = await res.text();
        throw new Error(`Search error: ${text}`);
    }

    const data = await res.json();
    return data.posts; 
}
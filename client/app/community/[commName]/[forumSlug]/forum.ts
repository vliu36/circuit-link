const BASE_URL = "http://https://api-circuit-link-160321257010.us-west2.run.app/api";

// Fetch posts belonging to a specific forum
export async function fetchPostsByForum(commName: string, forumSlug: string) {
    const res = await fetch(`${BASE_URL}/forums/get/${commName}/${forumSlug}`);

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
    author: string,
    title: string,
    contents: string,
    commName: string,
    forumSlug: string
) {
    const res = await fetch(`${BASE_URL}/posts/make-post`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ author, title, contents, commName, forumSlug }),
    });
    const data = await res.json();
    return data.message || "Post added!";
}

export async function editPost(postId: string, userId: string | undefined, title: string, contents: string) {
    const res = await fetch(`${BASE_URL}/posts/edit/${postId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, contents, userId }),
    });
    const data = await res.json();
    return data.message || "Post updated!";
}

export async function deletePostById(postId: string, userId: string | undefined) {
    const res = await fetch(`${BASE_URL}/posts/delete/${postId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
    });
    const data = await res.json();
    return data.message || "Post deleted!";
}

export async function votePost(id: string, userId: string, type: "yay" | "nay") {
    await fetch(`${BASE_URL}/posts/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, userId, type }),
    });
}
const BASE_URL = "http://localhost:2400/api/posts";

export async function fetchAllPosts() {
    const res = await fetch(`${BASE_URL}/all`);
    const data = await res.json();
    return data.message;
}

export async function createPost(author: string, title: string, contents: string) {
    const res = await fetch(`${BASE_URL}/make-post`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ author, title, contents }),
    });
    const data = await res.json();
    return data.message || "Post added!";
}

export async function editPost(postId: string, userId: string | undefined, title: string, contents: string) {
    const res = await fetch(`${BASE_URL}/edit/${postId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, contents, userId }),
    });
    const data = await res.json();
    return data.message || "Post updated!";
}

export async function deletePostById(postId: string, userId: string | undefined) {
    const res = await fetch(`${BASE_URL}/delete/${postId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
    });
    const data = await res.json();
    return data.message || "Post deleted!";
}

export async function votePost(id: string, userId: string, type: "yay" | "nay") {
    await fetch(`${BASE_URL}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, userId, type }),
    });
}
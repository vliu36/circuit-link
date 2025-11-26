// Helper functions for message handling in the frontend

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
export async function getMessages(receiver: string, isDirect: number, time: Date) {
    const res = await fetch(`${SERVER_URI}/getBefore/${receiver}/${isDirect}/${time.toString()}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" }
    });

    const data = await res.json();

    return {
        posts: data.messages,
    };
}
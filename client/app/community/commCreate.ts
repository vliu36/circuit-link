// This is for functions that help with creating a community

const BASE_URL = "http://localhost:2400/api/comm"

// Creates a community
export async function createCommunity(
    name: string,
    description: string,
    isPublic: boolean
) {
    try {
        const response = await fetch(`${BASE_URL}/create`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            credentials: "include", // sends the cookies to the backend
            body: JSON.stringify({ name, description, isPublic }),
        });
        const data = await response.json();
        return data;
    } catch (err) {
        console.error("Error creating community:", err);
        throw err;
    }
}


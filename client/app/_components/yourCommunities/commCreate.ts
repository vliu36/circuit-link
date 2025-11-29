// This is for functions that help with creating a community

import { auth } from "../../_firebase/firebase";

const BASE_URL = "http://localhost:2400/api/comm"

// Creates a community
export async function createCommunity(
    name: string,
    description: string,
    isPublic: boolean
) {
    try {
        const idToken = await auth.currentUser?.getIdToken();
        const response = await fetch(`${BASE_URL}/create`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${idToken}` // include the token in the Authorization header
            },
            // credentials: "include", // sends the cookies to the backend
            body: JSON.stringify({ name, description, isPublic }),
        });
        const data = await response.json();
        return data;
    } catch (err) {
        console.error("Error creating community:", err);
        throw err;
    }
}


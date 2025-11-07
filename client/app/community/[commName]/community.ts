import { DocumentReference } from "firebase/firestore";

const BASE_URL = "https://api-circuit-link-160321257010.us-west2.run.app/api"; // adjust as needed
import { Community } from "../../_types/types.ts";

interface CreateForumParams {
    name: string;
    description: string;
    userId: string;
    groupId: string;
    commName: string;
}

// Fetches the structure of the community (groups and forums)
export async function fetchStructure(communityName: string): Promise<Community | null> {
    try {
        const res = await fetch (`${BASE_URL}/comm/get-structure/${communityName}`);
        if (!res.ok) {
            console.error("Failed to fetch community structure", res.status, res.statusText);
            return null;
        }

        const data = await res.json();
        
        if (data.status !== "ok" || !data.community) {
            console.error("Error in response data:", data);
            return null;
        }

        return data.community as Community;
    } catch (err) {
        console.error(err);
        return null;
    } // end try catch
} // end fetchStructure

// Create a group in the current community
export async function createGroup( commName: string, name: string, userId: string ): Promise<{ status: string; message: string; groupId?: string }> {
    try {
        const res = await fetch(`${BASE_URL}/comm/create-group`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                commName,
                name,
                userId,
            }),
        });

        const data = await res.json();

        if (!res.ok) {
            console.error("Failed to create group:", data.message);
            return {
                status: "error",
                message: data.message || "Failed to create group.",
            };
        }

        console.log("Group created successfully:", data);
        return data;
    } catch (err) {
        console.error("Error creating group:", err);
        return {
            status: "error",
            message: err instanceof Error ? err.message : "Unknown error.",
        };
    } // end try catch
} // end createGroup

// Delete a group by its ID
export async function deleteGroup(groupId: string): Promise<{ status: string; message: string }> {
    try {
        const res = await fetch(`${BASE_URL}/comm/delete-group/${groupId}`, {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
        });
        const data = await res.json();

        if (!res.ok) {
            console.error("Failed to delete group:", data.message);
            return {
                status: "error",
                message: data.message || "Failed to delete group.",
            };
        }

        console.log("Group deleted successfully:", data);
        return data;
    } catch (err) {
        console.error("Error deleting group:", err);
        return {
            status: "error",
            message: err instanceof Error ? err.message : "Unknown error.",
        };
    } // end try catch
} // end deleteGroup

// Create a forum in a specified group within a community
export async function createForum({ name, description, userId, groupId, commName, }: CreateForumParams): Promise<string> {
    try {
        const res = await fetch(`${BASE_URL}/forums/create`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ name, description, userId, groupId, commName }),
        }); 
    
        const data = await res.json();

        if (!res.ok) {
            throw new Error(data.message || "Failed to create forum");
        }

        return data.docId; // return the newly created forum's ID
    } catch (err) {
        console.error("Error creating forum:", err);
        throw err;
    } // end try catch
} // end createForum

// Delete a forum by its ID
export async function deleteForum(forumId: string, userId: string): Promise<{ status: string; message: string }> {
    try {
        const res = await fetch(`${BASE_URL}/forums/delete/${forumId}`, {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ userId }),
        });
        const data = await res.json();

        if (!res.ok) {
            console.error("Failed to delete forum:", data.message);
            return {
                status: "error",
                message: data.message || "Failed to delete forum.",
            };
        }
        console.log("Forum deleted successfully:", data);
        return data;
    } catch (err) {
        console.error("Error deleting forum:", err);
        return {
            status: "error",
            message: err instanceof Error ? err.message : "Unknown error.",
        };
    } // end try catch
} // end deleteForum
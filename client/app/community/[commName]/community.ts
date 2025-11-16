const BASE_URL = "http://localhost:2400/api"; // adjust as needed
import { Community } from "../../_types/types.ts";

interface CreateForumParams {
    name: string;
    description: string;
    groupId: string;
    commName: string;
}

// Fetches the structure of the community (groups and forums)
export async function fetchStructure(communityName: string): Promise<Community | null> {
    try {
        const res = await fetch (`${BASE_URL}/comm/get-structure/${communityName}`);
        if (!res.ok) {
            console.log("Failed to fetch community structure", res.status, res.statusText);
            return null;
        }

        const data = await res.json();
        
        if (data.status !== "ok" || !data.community) {
            console.log("Error in response data:", data);
            return null;
        }

        return data.community as Community;
    } catch (err) {
        console.error(err);
        return null;
    } // end try catch
} // end fetchStructure

// Create a group in the current community
export async function createGroup( commName: string, name: string): Promise<{ status: string; message: string }> {
    try {
        const res = await fetch(`${BASE_URL}/comm/create-group`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                commName,
                name,
            }),
            credentials: "include",
        });

        const data = await res.json();

        if (!res.ok) {
            console.log("Failed to create group:", data.message);
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
export async function deleteGroup(groupId: string, commName: string): Promise<{ status: string; message: string }> {
    try {
        const res = await fetch(`${BASE_URL}/comm/delete-group/${groupId}`, {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ commName }),
            credentials: "include"
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
export async function createForum({ name, description, groupId, commName, }: CreateForumParams): Promise<string> {
    try {
        const res = await fetch(`${BASE_URL}/forums/create`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ name, description, groupId, commName }),
            credentials: "include",
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
export async function deleteForum(forumId: string, commName: string): Promise<{ status: string; message: string }> {
    try {
        const res = await fetch(`${BASE_URL}/forums/delete/${forumId}`, {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ commName }),
            credentials: "include",
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

// Delete the community
export async function deleteCommunity(commName: string) {
    try {
        const res = await fetch(`${BASE_URL}/comm/delete/${commName}`, {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json",
            },
            credentials: "include", // include the cookie
        });
        const data = await res.json();
        if (!res.ok) {
            console.log(data.message);
            return;
        }
        console.log(data.message);
        window.location.href = "/landing";
        return;
    } catch (err) {
        console.error("Error deleting community: ", err);
        throw err;
    } // end try catch
} // end deleteCommunity

// Join the community
export async function joinCommunity(commName: string): Promise<{ status: string; message: string }> {
    try {
        const res = await fetch(`${BASE_URL}/comm/join/${commName}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed to join community");

        console.log("Joined community successfully:", data);
        return data;
    } catch (err) {
        console.error("Error joining community:", err);
        return {
            status: "error",
            message: err instanceof Error ? err.message : "Unknown error",
        };
    }
}

// Leave the community
export async function leaveCommunity(commName: string): Promise<{ status: string; message: string }> {
    try {
        const res = await fetch(`${BASE_URL}/comm/leave/${commName}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
        });

        const data = await res.json();
        if (!res.ok) {
            console.log(data.message);
            alert(data.message);
            return {
                status: data.statusText,
                message: data.message
            };
        }

        console.log("Left community successfully:", data);
        return data;
    } catch (err) {
        console.error("Error leaving community:", err);
        return {
            status: "error",
            message: err instanceof Error ? err.message : "Unknown error",
        };
    }
}

// Promote a user to moderator
export async function promoteToMod(commName: string, userId: string): Promise<{ status: string; message: string }> {
    try {
        const res = await fetch(`${BASE_URL}/comm/promote-mod/${commName}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ userId }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed to promote user to mod");

        console.log("User promoted to mod successfully:", data);
        return data;
    } catch (err) {
        console.error("Error promoting to mod:", err);
        return {
            status: "error",
            message: err instanceof Error ? err.message : "Unknown error",
        };
    }
}

// Demote a user from moderator
export async function demoteMod(commName: string, userId: string): Promise<{ status: string; message: string }> {
    try {
        const res = await fetch(`${BASE_URL}/comm/demote-mod/${commName}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ userId }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed to demote user from mod");

        console.log("User demoted from mod successfully:", data);
        return data;
    } catch (err) {
        console.error("Error demoting mod:", err);
        return {
            status: "error",
            message: err instanceof Error ? err.message : "Unknown error",
        };
    }
}

// Promote a user to owner
export async function promoteToOwner(commName: string, userId: string): Promise<{ status: string; message: string }> {
    try {
        const res = await fetch(`${BASE_URL}/comm/promote-owner/${commName}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ userId }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed to promote user to owner");

        console.log("User promoted to owner successfully:", data);
        return data;
    } catch (err) {
        console.error("Error promoting to owner:", err);
        return {
            status: "error",
            message: err instanceof Error ? err.message : "Unknown error",
        };
    }
}

// Demote a user from owner
export async function demoteOwner(commName: string, userId: string): Promise<{ status: string; message: string }> {
    try {
        const res = await fetch(`${BASE_URL}/comm/demote-owner/${commName}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ userId }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed to demote user from owner");

        console.log("User demoted from owner successfully:", data);
        return data;
    } catch (err) {
        console.error("Error demoting owner:", err);
        return {
            status: "error",
            message: err instanceof Error ? err.message : "Unknown error",
        };
    }
}

// Edit community details
export async function editCommunity(
    commName: string,           // current community name
    newName?: string,           // new name for the community (optional)
    description?: string,       // new description for the community (optional)
    isPublic?: boolean          // new public status for the community (optional)
): Promise<{ status: string; message: string }> {
    try {
        const res = await fetch(`${BASE_URL}/comm/edit/${commName}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ newName, description, isPublic }),
        });
        const data = await res.json();

        if (!res.ok) {
            console.log("Failed to edit community:", data.message);
            return {
                status: "error",
                message: data.message || "Failed to edit community.",
            };
        }
        console.log("Community edited successfully:", data);
        return data;
    } catch (err) {
        console.log("Error editing community:", err);
        return {
            status: "error",
            message: err instanceof Error ? err.message : "Unknown error",
        };
    }
}
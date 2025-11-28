const BASE_URL = "http://localhost:2400/api"; // adjust as needed
import { uploadImage } from "@/app/_utils/mediaUpload.ts";
import { Community } from "../../_types/types.ts";
import { updateProfile } from "firebase/auth/web-extension";
import { doc, updateDoc, getDoc} from "firebase/firestore";
import { auth, db } from "@/app/_firebase/firebase.ts";

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
        const idToken = await auth.currentUser?.getIdToken();
        const res = await fetch(`${BASE_URL}/comm/create-group`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${idToken}`,
            },
            body: JSON.stringify({
                commName,
                name,
            }),
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
        const idToken = await auth.currentUser?.getIdToken();
        const res = await fetch(`${BASE_URL}/comm/delete-group/${groupId}`, {
            method: "DELETE",
            headers: { 
                "Content-Type": "application/json",
                "Authorization": `Bearer ${idToken}`,
            },
            body: JSON.stringify({ commName }),
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
        const idToken = await auth.currentUser?.getIdToken();
        const res = await fetch(`${BASE_URL}/forums/create`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${idToken}`,
            },
            body: JSON.stringify({ name, description, groupId, commName }),
        }); 
    
        const data = await res.json();

        if (!res.ok) {
            throw new Error(data.message || "Failed to create forum");
        }

        return data.newSlug; // return the newly created forum's ID
    } catch (err) {
        console.error("Error creating forum:", err);
        throw err;
    } // end try catch
} // end createForum

// Delete a forum by its ID
export async function deleteForum(forumId: string, commName: string): Promise<{ status: string; message: string }> {
    try {
        const idToken = await auth.currentUser?.getIdToken();
        const res = await fetch(`${BASE_URL}/forums/delete/${forumId}`, {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${idToken}`,
            },
            body: JSON.stringify({ commName }),
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
        const idToken = await auth.currentUser?.getIdToken();
        const res = await fetch(`${BASE_URL}/comm/delete/${commName}`, {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${idToken}`,
            },
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
        const idToken = await auth.currentUser?.getIdToken();
        const res = await fetch(`${BASE_URL}/comm/join/${commName}`, {
            method: "POST",
            headers: { 
                "Content-Type": "application/json",
                "Authorization": `Bearer ${idToken}`,
            },
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
        const idToken = await auth.currentUser?.getIdToken();
        const res = await fetch(`${BASE_URL}/comm/leave/${commName}`, {
            method: "POST",
            headers: { 
                "Content-Type": "application/json",
                "Authorization": `Bearer ${idToken}`,
            },
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
        const idToken = await auth.currentUser?.getIdToken();
        const res = await fetch(`${BASE_URL}/comm/promote-mod/${commName}`, {
            method: "POST",
            headers: { 
                "Content-Type": "application/json",
                "Authorization": `Bearer ${idToken}`,
            },
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
        const idToken = await auth.currentUser?.getIdToken();
        const res = await fetch(`${BASE_URL}/comm/demote-mod/${commName}`, {
            method: "POST",
            headers: { 
                "Content-Type": "application/json",
                "Authorization": `Bearer ${idToken}`,
            },
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
        const idToken = await auth.currentUser?.getIdToken();
        const res = await fetch(`${BASE_URL}/comm/promote-owner/${commName}`, {
            method: "POST",
            headers: { 
                "Content-Type": "application/json",
                "Authorization": `Bearer ${idToken}`,
            },
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
        const idToken = await auth.currentUser?.getIdToken();
        const res = await fetch(`${BASE_URL}/comm/demote-owner/${commName}`, {
            method: "POST",
            headers: { 
                "Content-Type": "application/json",
                "Authorization": `Bearer ${idToken}`,
            },
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
    isPublic?: boolean,          // new public status for the community (optional)
    rules?: string               // new rules for the community (optional)
): Promise<{ status: string; message: string }> {
    try {
        const idToken = await auth.currentUser?.getIdToken();
        const res = await fetch(`${BASE_URL}/comm/edit/${commName}`, {
            method: "PUT",
            headers: { 
                "Content-Type": "application/json",
                "Authorization": `Bearer ${idToken}`,
            },
            body: JSON.stringify({ newName, description, isPublic, rules }),
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

// Edit group name
export async function editGroup(
    commName: string,
    groupId: string,
    newName: string
): Promise<{ status: string; message: string }> {
    try {
        const idToken = await auth.currentUser?.getIdToken();
        const res = await fetch(`${BASE_URL}/comm/edit-group/${groupId}`, {
            method: "PUT",
            headers: { 
                "Content-Type": "application/json",
                "Authorization": `Bearer ${idToken}`,
            },
            body: JSON.stringify({ commName, newName }),
        });
        const data = await res.json();
        if (!res.ok) {
            console.log("Failed to edit group:", data.message);
            return {
                status: "error",
                message: data.message || "Failed to edit group.",
            };
        }
        console.log("Group edited successfully:", data);
        return data;
    } catch (err) {
        console.log("Error editing group:", err);
        return {
            status: "error",
            message: err instanceof Error ? err.message : "Unknown error",
        };
    }
}

// Change community icon
export async function changeCommunityIcon(file: File, commId: string) {
    try {
        // Upload new icon
        const fileName = await uploadImage(file);
        if (!fileName) throw new Error("Image upload failed — no filename returned.");

        // Construct public URL
        const finalPublicPath = `images/${fileName}`;
        const publicUrl = `https://storage.googleapis.com/circuit-link.firebasestorage.app/${finalPublicPath}`;

        // Update community document in Firestore
        const commDocRef = doc(db, "Communities", commId);
        await updateDoc(commDocRef, { icon: publicUrl });

        console.log("Community icon updated successfully:", publicUrl);
        return publicUrl;

    } catch (error) {
        console.error("Error uploading profile picture:", error);
        throw error;
    }
}

// Change community banner
export async function changeCommunityBanner(file: File, commId: string) {
    try {
        // Upload new banner
        const fileName = await uploadImage(file);
        if (!fileName) throw new Error("Image upload failed — no filename returned.");

        // Construct public URL
        const finalPublicPath = `images/${fileName}`;
        const publicUrl = `https://storage.googleapis.com/circuit-link.firebasestorage.app/${finalPublicPath}`;

        // Update community document in Firestore
        const commDocRef = doc(db, "Communities", commId);
        await updateDoc(commDocRef, { banner: publicUrl });
        console.log("Community banner updated successfully:", publicUrl);
        return publicUrl;

    } catch (error) {
        console.error("Error uploading profile picture:", error);
        throw error;
    }
}

// Fetch community blacklisted users
export async function fetchBlacklistedUsers(commName: string): Promise<string[] | null> {
    try {
        const idToken = await auth.currentUser?.getIdToken();
        const res = await fetch(`${BASE_URL}/comm/blacklist/${commName}`, {
            method: "GET",
            headers: { 
                "Content-Type": "application/json",
                "Authorization": `Bearer ${idToken}`,
            },
        });
        const data = await res.json();
        if (!res.ok) {
            console.log("Failed to fetch blacklisted users:", data.message);
            return null;
        }
        return data.blacklistedUsers || null;
    } catch (err) {
        console.log("Error fetching blacklisted users:", err);
        return null;
    }
}

// Kick a member from the community
export async function kickMember(commName: string, userId: string): Promise<{ status: string; message: string }> {
    try {
        const idToken = await auth.currentUser?.getIdToken();
        const res = await fetch(`${BASE_URL}/comm/kick-user`, {
            method: "POST",
            headers: { 
                "Content-Type": "application/json",
                "Authorization": `Bearer ${idToken}`,
            },
            body: JSON.stringify({ userId, commName }),
        });
        const data = await res.json();
        if (!res.ok) {
            console.log("Failed to kick member:", data.message);
            return {
                status: "error",
                message: data.message || "Failed to kick member.",
            };
        }
        console.log("Member kicked successfully:", data);
        return data;
    } catch (err) {
        console.log("Error kicking member:", err);
        return {
            status: "error",
            message: err instanceof Error ? err.message : "Unknown error",
        };
    }
}

// Ban a member from the community
export async function banMember(commName: string, userId: string): Promise<{ status: string; message: string }> {
    try {
        const idToken = await auth.currentUser?.getIdToken();
        const res = await fetch(`${BASE_URL}/comm/ban-user`, {
            method: "POST",
            headers: { 
                "Content-Type": "application/json",
                "Authorization": `Bearer ${idToken}`,
            },
            body: JSON.stringify({ userId, commName }),
        });
        const data = await res.json();
        if (!res.ok) {
            console.log("Failed to ban member:", data.message);
            return {
                status: "error",
                message: data.message || "Failed to ban member.",
            };
        }
        console.log("Member banned successfully:", data);
        return data;
    } catch (err) {
        console.log("Error banning member:", err);
        return {
            status: "error",
            message: err instanceof Error ? err.message : "Unknown error",
        };
    } // end try catch
} // end banMember

// Unban a member from the community
export async function unbanMember(commName: string, userId: string): Promise<{ status: string; message: string }> {
    try {
        const idToken = await auth.currentUser?.getIdToken();
        const res = await fetch(`${BASE_URL}/comm/unban-user`, {
            method: "POST",
            headers: { 
                "Content-Type": "application/json",
                "Authorization": `Bearer ${idToken}`,
            },
            body: JSON.stringify({ userId, commName }),
        });
        const data = await res.json();
        if (!res.ok) {
            console.log("Failed to unban member:", data.message);
            return {
                status: "error",
                message: data.message || "Failed to unban member.",
            };
        }
        console.log("Member unbanned successfully:", data);
        return data;
    } catch (err) {
        console.log("Error unbanning member:", err);
        return {
            status: "error",
            message: err instanceof Error ? err.message : "Unknown error",
        };
    }
}

// Ensure that the community has a "general" group; create one if missing
export async function ensureDefaultGroup(commName: string) {
    try {
        const commRef = doc(db, "Communities", commName);
        const commSnap = await getDoc(commRef);

        if (!commSnap.exists()) {
            console.error("Community not found:", commName);
            return null;
        }

        const community = commSnap.data();
        const groups = community.groupsInCommunity || [];

        // If "general" already exists → return it
        const existing = groups.find(
            (g: any) => g.name.toLowerCase() === "general"
        );
        if (existing) return existing;

        // Create new default group
        const newGroup = {
            id: crypto.randomUUID(),
            name: "general",
            description: "Default general group",
            createdAt: Date.now(),
            forumsInGroup: [],
        };

        // Push new group to array
        await updateDoc(commRef, {
            groupsInCommunity: [...groups, newGroup],
        });

        console.log("Default general group created.");
        return newGroup;
    } catch (err) {
        console.error("Error ensuring default group:", err);
        return null;
    }
}
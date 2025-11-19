import { auth } from "./_firebase/firebase";

// Log user out (revised)
export async function logout() {
    try {
        await auth.signOut();
        console.log("User signed out.");
        // Clear the session cookie
        const res = await fetch("http://localhost:2400/api/users/logout", {
            method: "POST",
            credentials: "include",
        })
        const data = await res.json();
        console.log( data.message );

        window.location.href = "http://localhost:3000/"
        return { status: "ok", message: "User signed out successfully", };
    } catch (err) {
        console.error("Error signing out:", err);
        return { status: "error", message: "An error occurred while signing out.", };
    } // end try catch
} // end function logout

/** Retrieve the top 10 communities by yay score
 *  @returns Array of top communities sorted by yay score, or an error
 *      id: string
 *      name: string
 *      icon: string (photo url)
 *      numUsers: number
 *      yayScore: number
 */
export async function fetchTopCommunities() {
    try {
        const response = await fetch("http://localhost:2400/api/comm/top");
        const data = await response.json();
        if (response.ok) {
            return data; // Return array of top communities
        } else {
            throw new Error(data.message || "Failed to fetch top communities");
        }
    } catch (err) {
        console.error("Error fetching top communities:", err);
        return [];
    }
}

/** Retrieve the top 10 users by yay score
 *  @returns Array of top users sorted by yay score, or an error
 *      id: string
 *      username: string
 *      photoURL: string
 *      yayScore: number
 */
export async function fetchTopUsers() {
    try {
        const response = await fetch("http://localhost:2400/api/users/top");
        const data = await response.json();
        if (response.ok) {
            return data; // Return array of top users
        } else {
            throw new Error(data.message || "Failed to fetch top users");
        }
    } catch (err) {
        console.error("Error fetching top users:", err);
        return [];
    }
}
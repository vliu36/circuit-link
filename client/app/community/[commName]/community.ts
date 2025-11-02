const BASE_URL = "http://localhost:2400/api"; // adjust as needed

// Types
export interface Forum {
    id: string;
    name: string;
    slug: string;
    description: string;
}

export interface Group {
    id: string;
    name: string;
    description: string;
    forumsInGroup: Forum[];
}

export interface Community {
    id: string;
    name: string;
    description: string;
    groupsInCommunity: Group[];
}

// Fetches the structure of the community (groups and forums)
export async function fetchStructure(communityName: string): Promise<Community | null> {
    try {
        const res = await fetch (`${BASE_URL}/comm/get-structure/${communityName}`);
        if (!res.ok) {
            console.error("Failed to fetch community structure", res.statusText);
            return null;
        }

        const data = await res.json();
        console.log(data);
        return data.community as Community;
    } catch (err) {
        console.error(err);
        return null;
    } // end try catch
}
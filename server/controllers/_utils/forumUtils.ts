// Utility functions for forums
import { db } from "../../firebase.ts"
import { DocumentReference, FieldValue } from "firebase-admin/firestore";

// -------- Helper function for addDoc --------  //
// --- Helper for checking duplicate forum names/slugs in a community --- //
export const checkDuplicateForum = async (name: string, slug: string, commRef: DocumentReference) => {
    const forumsSnap = await db.collection("Forums")
        .where("parentCommunity", "==", commRef)
        .get();

    for (const forumDoc of forumsSnap.docs) {
        const forumData = forumDoc.data();
        if (forumData.name === name || forumData.slug === slug) {
            return true;
        }
    }
    return false;
};

// -------- Helper functions for getForumBySlug -------- //
// --- Helper: Get community document by name ---
// ! Deprecated, use getCommunityByName from commUtils.ts instead
export async function getCommunityByName(commName: string) {
    const commSnap = await db
        .collection("Communities")
        .where("name", "==", commName)
        .limit(1)
        .get();

    if (commSnap.empty) return null;
    const commDoc = commSnap.docs[0];
    return { commDoc, commData: commDoc.data() };
}


// --- Helper: Find a forum reference within a community by slug ---
export async function findForumRefInCommunity(commData: any, forumSlug: string): Promise<DocumentReference | null> {
    const forumsInCommunity: DocumentReference[] = commData.forumsInCommunity || [];

    for (const ref of forumsInCommunity) {
        if (!ref || typeof ref.get !== "function") continue;
        const forumSnap = await ref.get();
        const forumData = forumSnap.data();
        if (forumData?.slug === forumSlug) return ref;
    }

    return null;
}

// --- Helper: Retrieve and enrich post data ---
export async function getFormattedPosts(
    postRefs: DocumentReference[], 
    sortMode: string, // "newest" | "oldest" | "mostYays" | "alphabetical"
) {
    const posts = await Promise.all(
        postRefs.map(async (postRef) => {
            const postSnap = await postRef.get();
            if (!postSnap.exists) return null;

            const data = postSnap.data();

            // Author dereferencing 
            let authorUsername = "Unknown";
            let authorId = "Unknown";
            if (data?.author?.get) {
                const authorSnap = await data.author.get();
                if (authorSnap.exists) {
                    authorUsername = authorSnap.data()?.username || "Unknown";
                    authorId = authorSnap.id;
                }
            }

            // Convert yayList/nayList to arrays of user IDs
            const yayList = (data?.yayList || []).map((ref: DocumentReference | string) =>
                typeof ref === "string" ? ref : ref.path.split("/").pop()
            );
            const nayList = (data?.nayList || []).map((ref: DocumentReference | string) =>
                typeof ref === "string" ? ref : ref.path.split("/").pop()
            );

            return {
                id: postSnap.id,
                ...data,
                authorUsername,
                authorId,
                yayList,
                nayList,
                timePosted: data?.timePosted?.toMillis() || null,
            };
        })
    );

    const validPosts = posts.filter(Boolean);
    switch (sortMode) {
        case "newest":
            return validPosts.sort((a: any, b: any) => (b.timePosted || 0) - (a.timePosted || 0));
        case "oldest":
            return validPosts.sort((a: any, b: any) => (a.timePosted || 0) - (b.timePosted || 0));
        case "mostYays":
            return validPosts.sort((a: any, b: any) => (b.yayList.length || 0) - (a.yayList.length || 0));
        case "alphabetical":
            return validPosts.sort((a: any, b: any) => {
                const titleA = (a.title || "").toLowerCase();
                const titleB = (b.title || "").toLowerCase();
                return titleA.localeCompare(titleB);
            });
        default:
            return validPosts;
    }
}

// -------- Helper functions for deleteForum -------- //
// --- Helper to delete replies recursively --- //
export async function deleteRepliesRecursively(parentRef: DocumentReference): Promise<void> {
    const repliesSnapshot = await db
        .collection("Replies")
        .where("parentPost", "==", parentRef)
        .get();

    // For each reply: delete its children first
    for (const replyDoc of repliesSnapshot.docs) {
        const replyRef = replyDoc.ref;
        await deleteRepliesRecursively(replyRef); // recursive step for nested replies
        await replyRef.delete();

        // Update community's yayScore by decrementing the reply's yayScore
        const replyData = replyDoc.data();
        const commRef: FirebaseFirestore.DocumentReference = replyData?.parentCommunity;
        await commRef.update({
            yayScore: FieldValue.increment(-replyData?.yayScore || 0),
        });
    }
}

// --- Helper to dereference forum from parent group and community ---
export async function dereferenceForumFromParents(forumRef: DocumentReference, forumData: any): Promise<void> {
    const parentGroupRef: DocumentReference | undefined = forumData?.parentGroup;
    const parentCommunityRef: DocumentReference | undefined = forumData?.parentCommunity;
    if (parentGroupRef) {
        await parentGroupRef.update({
            forumsInGroup: FieldValue.arrayRemove(forumRef),
        });
    }
    if (parentCommunityRef) {
        await parentCommunityRef.update({
            forumsInCommunity: FieldValue.arrayRemove(forumRef),
        });
    }
}

// --- Helper to get forum data by ID for editForum in forums.ts ---
export async function getForumById(forumId: string) {
    // Retrieve forum
    const forumRef = db.collection("Forums").doc(forumId);
    const forumSnap = await forumRef.get();

    if (!forumSnap.exists) {
        throw new Error("Forum not found");
    }

    const forumData = forumSnap.data();
    if (!forumData) {
        throw new Error("Forum data is undefined; could not be retrieved.");
    }
    
    return { forumRef, forumData };
} 

// --- Helper function to get parent community by reference for editForum in forums.ts ---
export async function getParentCommByRef(commRef: DocumentReference) {
    const commSnap = await commRef.get();
    if (!commSnap.exists) {
        throw new Error("Parent community not found");
    }
    const commData = commSnap.data();
    if (!commData) {
        throw new Error("Parent community data is undefined; could not be retrieved.");
    }
    
    return { commRef, commData };
}
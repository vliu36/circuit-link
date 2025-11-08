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
export async function getFormattedPosts(postRefs: DocumentReference[]) {
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

    // Remove nulls and sort
    return posts
        .filter(Boolean)
        .sort((a: any, b: any) => (b.timePosted || 0) - (a.timePosted || 0));
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
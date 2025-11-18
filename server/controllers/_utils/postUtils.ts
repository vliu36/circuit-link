// Utility functions for posts

import { DocumentReference, FieldValue, Timestamp } from "firebase-admin/firestore";
import { db } from "../../firebase.ts"
import { verifyUserIsOwnerOrMod } from "./generalUtils.ts";

export interface Post {
    author: DocumentReference;
    title: string;
    contents: string;
    yayScore: number;
    replyCount: number;
    yayList: DocumentReference[];
    nayList: DocumentReference[];
    timePosted: Timestamp;
    timeUpdated: Timestamp;
    listOfReplies: DocumentReference[];
    edited: boolean;
    keywords: Array<string>;
}

// Reply interface for nested replies
export interface Reply {
    id: string,
    authorUsername: string,
    authorId: string,
    yayList: string[],
    nayList: string[],
    timeReply: Timestamp;
    listOfReplies: Reply[];
    edited: boolean;
    contents: string;
}

// Helper function for getPostById to retrieve replies for a post
export const fetchRepliesRecursively = async (replyRefs: DocumentReference[] = []): Promise<Reply[]> => {
    if (!replyRefs || replyRefs.length === 0) {
        return [];
    }
    const replies: Reply[] = [];

    for (const ref of replyRefs) {
        const replySnap = await ref.get();
        if (!replySnap.exists) continue;

        const replyData = replySnap.data();

        // Dereference reply author
        let replyAuthorUsername = "Unknown";
        let replyAuthorId = "Unknown";
        if (replyData?.author?.get) {
            const authorSnap = await replyData.author.get();
            replyAuthorUsername = authorSnap.exists ? authorSnap.data()?.username || "Unknown" : "Unknown";
            replyAuthorId = replyData.author.path.split("/").pop() || "Unknown";
        }

        // Convert yayList/nayList references to user IDs
        const yayList: string[] = (replyData?.yayList || []).map((ref: DocumentReference | string) =>
            typeof ref === "string" ? ref : ref.path.split("/").pop() || "Unknown"
        );
        const nayList: string[] = (replyData?.nayList || []).map((ref: DocumentReference | string) =>
            typeof ref === "string" ? ref : ref.path.split("/").pop() || "Unknown"
        );

        // Recursively fetch nested replies
        const nestedReplies = await fetchRepliesRecursively(replyData?.listOfReplies || []);

        replies.push({
            id: replySnap.id,
            contents: replyData?.contents || "",
            edited: replyData?.edited,
            ...replyData,
            authorUsername: replyAuthorUsername,
            authorId: replyAuthorId,
            yayList,
            nayList,
            timeReply: replyData?.timeReply?.toMillis(),
            listOfReplies: nestedReplies,
        });
    } // end for
    
    return replies;
};

// --- Helper function for deleteDoc that recursively deletes replies and their nested replies --- //
// Difference between deletePostRepliesRecursive: this one does NOT update the parent post's replyCount, since the post itself is being deleted
export const deleteNestedRepliesRecursive = async (replyRefs: FirebaseFirestore.DocumentReference[]) => {
    for (const replyRef of replyRefs) {
        const replyDoc = await replyRef.get();
        if (!replyDoc.exists) continue;

        const replyData = replyDoc.data();

        if (replyData?.listOfReplies?.length) {
            await deleteNestedRepliesRecursive(replyData.listOfReplies);
        }

        // Update community's yayScore by decrementing the reply's yayScore
        const commRef: FirebaseFirestore.DocumentReference = replyData?.parentCommunity;
        await commRef.update({
            yayScore: FieldValue.increment(-replyData?.yayScore || 0),
        });
        // Update author's yayScore by decrementing the reply's yayScore
        const authorRef: FirebaseFirestore.DocumentReference = replyData?.author;
        await authorRef.update({
            yayScore: FieldValue.increment(-replyData?.yayScore || 0),
        });

        // Delete the reply
        await replyRef.delete();

    } // end for
} // end helper function deleteRepliesRecursive



// --- Helper function for addDoc in posts.ts to get its forum by slug, and subsequently the forum's parent group --- //
export const getPostForumAndGroup = async ( commData: FirebaseFirestore.DocumentData, forumSlug: string ): Promise<{ forumRef: DocumentReference | null; parentGroupRef: DocumentReference | null }> => {
    const forumsInCommunity: DocumentReference[] = commData.forumsInCommunity || [];
    let forumRef: DocumentReference | null = null;
    let parentGroupRef: DocumentReference | null = null;

    for (const fRef of forumsInCommunity) {
        const fSnap = await fRef.get();
        const fData = fSnap.data();
        if (fData?.slug === forumSlug) {
            forumRef = fRef;
            parentGroupRef = fData?.parentGroup;
            break;
        }
    }

    if (!forumRef) {
        throw new Error(`Forum with slug '${forumSlug}' not found in the specified community.`);
    }
    if (!parentGroupRef) {
        throw new Error(`Parent group for forum '${forumSlug}' not found.`);
    }

    return { forumRef, parentGroupRef };
}
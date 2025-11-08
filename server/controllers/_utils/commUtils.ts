// Utility functions for communities

import { DocumentReference, FieldValue } from "firebase-admin/firestore";
import { db } from "../../firebase";

export interface Forum {
    id: string,
    name: string,
    slug: string,
    description?: string,
}

export interface Group {
    id: string,
    name: string,
    forumsInGroup: Forum[],
}

// -------- Helper functions for deleteGroup -------- //
// --- Helper function for deleteGroup to recursively delete replies of a post or another reply --- //
export async function deleteRepliesRecursively(replyRef: DocumentReference) {
    const repliesSnap = await db.collection("Replies")
        .where("parentReply", "==", replyRef)
        .get();

    for (const replyDoc of repliesSnap.docs) {
        await deleteRepliesRecursively(replyDoc.ref); // recursive deletion
        await replyDoc.ref.delete();
    }

    await replyRef.delete(); // finally delete the reply itself
}

// --- Helper function for deleteGroup to recursively delete posts and replies in a forum --- //
export async function deletePostsInForum(forumRef: DocumentReference) {
    const postsSnap = await db.collection("Posts")
        .where("parentForum", "==", forumRef)
        .get();

    for (const postDoc of postsSnap.docs) {
        const postRef = postDoc.ref;

        // Delete replies belonging to this post
        const repliesSnap = await db.collection("Replies")
            .where("parentPost", "==", postRef)
            .get();

        for (const replyDoc of repliesSnap.docs) {
            await deleteRepliesRecursively(replyDoc.ref);
        }

        await postRef.delete(); // delete the post itself
    }
}

// --- Helper function for deleteGroup to recursively delete forums, posts, and replies in a group --- //
export async function deleteForumsInGroup(groupRef: DocumentReference) {
    const forumsSnap = await db.collection("Forums")
        .where("parentGroup", "==", groupRef)
        .get();

    for (const forumDoc of forumsSnap.docs) {
        const forumRef = forumDoc.ref;

        // Dereference the forum from its parent community
        const forumData = forumDoc.data();
        const parentCommunityRef: DocumentReference | undefined = forumData?.parentCommunity;
        if (parentCommunityRef) {
            await parentCommunityRef.update({
                forumsInCommunity: FieldValue.arrayRemove(forumRef)
            });
        }

        // Delete all posts in this forum
        await deletePostsInForum(forumRef);

        // Finally, delete the forum itself
        await forumRef.delete();
    }
}

// Helper function to fetch user data from references
export const fetchUserData = async (userRefs: DocumentReference[]) => {
    const users = [];
    for (const userRef of userRefs) {
        const userSnap = await userRef.get();
        if (userSnap.exists) {
            users.push({ id: userSnap.id, ...userSnap.data() });
        }
    }
    return users;
};
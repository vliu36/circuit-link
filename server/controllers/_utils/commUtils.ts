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
    
    // Update community's yayScore by decrementing the reply's yayScore
    const replyData = (await replyRef.get()).data();
    const commRef: FirebaseFirestore.DocumentReference = replyData?.parentCommunity;
    await commRef.update({
        yayScore: FieldValue.increment(-replyData?.yayScore || 0),
    });

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

        // Update community's yayScore by decrementing the post's yayScore
        const postData = postDoc.data();
        const commRef: FirebaseFirestore.DocumentReference = postData?.parentCommunity;
        await commRef.update({
            yayScore: FieldValue.increment(-postData?.yayScore || 0),
        });
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

// Helper function for joinCommunity in /controllers/communities.ts to add user to community and community to user's communities field
export const addUserToCommunity = async (
    commRef: FirebaseFirestore.DocumentReference,
    userRef: FirebaseFirestore.DocumentReference,
    userId: string,
    communityName: string
): Promise<void> => {
    await db.runTransaction(async (transaction) => {
        const commSnap = await transaction.get(commRef);
        const userSnap = await transaction.get(userRef);

        // Check if user exists
        if (!userSnap.exists) {
            throw new Error("User not found");
        }

        const commData = commSnap.data();
        const userList = commData?.userList || [];

        // Check if user is already a member
        const isMember = userList.some(
            (ref: FirebaseFirestore.DocumentReference) => ref.id === userId
        );

        if (isMember) {
            throw new Error("User is already a member of this community");
        }

        // Add the user reference to the community's userList, increment numUsers
        transaction.update(commRef, {
            userList: FieldValue.arrayUnion(userRef),
            numUsers: FieldValue.increment(1),
        });

        // Add the community's reference to the user's communities
        transaction.update(userRef, {
            communities: FieldValue.arrayUnion(commRef),
        });
    });
};

// Helper function to remove user from community
export const removeUserFromCommunity = async (
            commRef: DocumentReference, 
            userRef: DocumentReference, 
            userId: string, 
            communityName: string
        ) => {
            await db.runTransaction(async (transaction) => {
                const commSnap = await transaction.get(commRef);
                const userSnap = await transaction.get(userRef);

                if (!userSnap.exists) {
                    throw new Error("User not found");
                }

                const commData = commSnap.data();
                if (!commData) {
                    throw new Error("Community data not found");
                }

                const userList: FirebaseFirestore.DocumentReference[] = commData.userList || [];
                const ownerList: FirebaseFirestore.DocumentReference[] = commData.ownerList || []; 

                const isMember = userList.some(ref => ref.id === userId);
                const isOwner = ownerList.some(ref => ref.id === userId);

                // Check if user is not a member
                if (!isMember) {
                    throw new Error("User is not a member of this community.");
                }
                // Check if user is the only owner
                if (isOwner && ownerList.length === 1) {
                    throw new Error("Cannot leave community: You are the only owner. Transfer ownership first before leaving.");
                }

                // Remove user from community userList, modList, and ownerList, decrement numUsers
                transaction.update(commRef, {
                    userList: FieldValue.arrayRemove(userRef),
                    modList: FieldValue.arrayRemove(userRef),
                    ownerList: FieldValue.arrayRemove(userRef),
                    numUsers: FieldValue.increment(-1),
                });

                // Remove the community reference from the user's communities field
                transaction.update(userRef, {
                    communities: FieldValue.arrayRemove(commRef),
                });
            });
        };
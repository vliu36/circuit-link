// Helper functions for reply controllers
import { DocumentReference, FieldValue, Timestamp } from "firebase-admin/firestore";

// export interface Reply {
//     id: string;
//     authorUsername: string;
//     authorId: string;
//     yayList: string[];
//     nayList: string[];
//     timeReply: Timestamp;
//     listOfReplies: Reply[];
//     edited: boolean;
//     contents: string;
//     parentPost: DocumentReference;
//     parentForum?: DocumentReference;
//     parentGroup?: DocumentReference;
//     parentCommunity?: DocumentReference;
// }


// --- Helper: delete nested replies of a reply recursively --- //
// Difference between deleteNestedRepliesRecursive: this one updates the parent post's replyCount, while the other does not
export const deletePostRepliesRecursive = async (replyRefs: DocumentReference[]) => {
    for (const rRef of replyRefs) {
        const rDoc = await rRef.get();
        if (!rDoc.exists) continue;
        const rData = rDoc.data();
        if (rData?.listOfReplies?.length) {
            await deletePostRepliesRecursive(rData.listOfReplies);
        }

        await rRef.delete();
        // Decrement replyCount in parent post
        const parentPostRef: FirebaseFirestore.DocumentReference = rData?.parentPost;
        await parentPostRef?.update({
            replyCount: FieldValue.increment(-1),
        });
        // Update yayScore in parent community
        const commRef: FirebaseFirestore.DocumentReference = rData?.parentCommunity;
        await commRef?.update({
            yayScore: FieldValue.increment(-rData?.yayScore || 0),
        });
    }
};


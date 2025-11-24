// Helper functions for messages API

import { DocumentReference } from "firebase-admin/firestore";
import { db } from "../../firebase.ts";

// Retrieve contents of author referenced in message reference
export async function formatMessageData(messagesRefs: DocumentReference[]) {
    try {
        const formattedData = await Promise.all(
            messagesRefs.map(async (doc) => {
                const snapshot = await doc.get();
                const data = snapshot.data();

                let userId = "";
                let username = "";
                let userIcon = "";
                if (data?.author?.get) {
                    const authorSnap = await data.author.get();
                    if (authorSnap.exists) {
                        userId = authorSnap.id;
                        username = authorSnap.data()?.username || "Unknown";
                        userIcon = authorSnap.data()?.photoURL || "Unknown";
                    }
                }
                
                return {
                    ...data,
                    authorId: userId,
                    authorName: username,
                    authorIcon: userIcon,
                    timestamp: data?.timestamp.toMillis(),
                }
            })
        )
        return formattedData;
    }
    catch (err) {
        throw new Error(`ERROR: function formatMessageData: ${err}`);
    }
}
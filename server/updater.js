// updater.ts
import * as admin from "firebase-admin";
import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

// Initialize Firebase Admin SDK
// Make sure your service account JSON is in the correct path
initializeApp({
    credential: applicationDefault(),
    projectId: "circuit-link",
});

const db = getFirestore();

async function addMediaFieldToPosts() {
  const postsRef = db.collection("Posts");
  const snapshot = await postsRef.get();

  console.log(`Found ${snapshot.size} posts.`);

  for (const docSnap of snapshot.docs) {
    const data = docSnap.data();

    if (("parentCommunity" in data)) {
      await docSnap.ref.update({ media: null }); // Or null if you prefer
      console.log(`Updated post ${docSnap.id} with empty media field.`);
    } else {
      console.log(`Post ${docSnap.id} already has media field.`);
    }
  }

  console.log("All posts processed.");
}

addMediaFieldToPosts()
  .then(() => {
    console.log("Update complete!");
    process.exit(0);
  })
  .catch((err) => {
    console.error("Error updating posts:", err);
    process.exit(1);
  });

// async function deletePostsWithoutParentCommunity() {
//   const postsRef = db.collection("Replies");
//   const snapshot = await postsRef.get();

//   if (snapshot.empty) {
//     console.log("No posts found.");
//     return;
//   }

//   const batch = db.batch();
//   let count = 0;

//   snapshot.forEach(doc => {
//     const data = doc.data();

//     // If the field does NOT exist → delete it
//     if (!("parentCommunity" in data)) {
//       batch.delete(doc.ref);
//       count++;
//     }
//   });

//   if (count === 0) {
//     console.log("No orphan posts found.");
//     return;
//   }

//   await batch.commit();
//   console.log(`Deleted ${count} posts missing parentCommunity.`);
// }

// deletePostsWithoutParentCommunity();

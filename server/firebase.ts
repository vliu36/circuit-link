import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const firebaseApp = initializeApp({
    credential: applicationDefault(),
    // projectId: "circuit-link"
    projectId: "test-f3597"
});
const db = getFirestore();

export { firebaseApp, db };
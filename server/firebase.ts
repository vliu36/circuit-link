import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";

const firebaseApp = initializeApp({
    credential: applicationDefault(),
    projectId: "circuit-link"
});
const db = getFirestore();

const auth = getAuth();

export { firebaseApp, db, auth };

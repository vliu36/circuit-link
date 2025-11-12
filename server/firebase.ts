import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import { getStorage } from "firebase-admin/storage";

const cloudUrl = "gs://circuit-link.firebasestorage.app"

const firebaseApp = initializeApp({
    credential: applicationDefault(),
    projectId: "circuit-link"
});
const db = getFirestore();

const auth = getAuth();

const bucket = getStorage().bucket(cloudUrl);


export { firebaseApp, db, auth, bucket };
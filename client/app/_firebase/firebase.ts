// This is to initialize the Firebase app for frontend. 
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getFunctions } from "firebase/functions";
// import { connectAuthEmulator } from "firebase/auth";
// import { connectFirestoreEmulator } from "firebase/firestore";
// import { connectStorageEmulator } from "firebase/storage";

const firebaseConfig = {
    apiKey: "AIzaSyD3VCMA1MxjtLzXjkEFXr-XEPpkyftPSTo", // for circuit-link
    authDomain: "circuit-link.firebaseapp.com",
    projectId: "circuit-link",
    storageBucket: "circuit-link.firebasestorage.app",  // Default bucket
}

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);

const db = getFirestore(app);

const storage = getStorage(app, "gs://circuit-link"); // This uses our custom bucket

const functions = getFunctions();

// connectAuthEmulator(auth, "http://localhost:9099/");
// connectFirestoreEmulator(db, "localhost", 8080);
// connectStorageEmulator(storage, "localhost", 9199);

export { app, auth, db, storage, functions };
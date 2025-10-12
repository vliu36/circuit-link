// This is to initialize the Firebase app for frontend. 
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const app = initializeApp({ 
    apiKey: "AIzaSyD3VCMA1MxjtLzXjkEFXr-XEPpkyftPSTo", 
    authDomain: "circuit-link.firebaseapp.com",
    projectId: "circuit-link",
});

const auth = getAuth(app);

const db = getFirestore(app);

export { app, auth, db };

// This is to initialize the Firebase app for frontend. 
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// const app = initializeApp({ apiKey: "AIzaSyD3VCMA1MxjtLzXjkEFXr-XEPpkyftPSTo" });
const app = initializeApp({ 
    apiKey: "AIzaSyAhF6CQqbNraQ_CYKlev45r3GgEk3j1sVo", // Key for test-f3597
    authDomain: "test-f3597.firebaseapp.com",
    projectId: "test-f3597",
});

const auth = getAuth(app);

const db = getFirestore(app);

export { app, auth, db };
import { initializeApp } from "firebase/app";
import env from "dotenv";
import app from "./app.ts";

env.config();

// Do not expose the env stuff ever!!
const port = process.env.PORT || 2400;
const API_KEY = process.env.API_KEY;
const DOMAIN = process.env.DOMAIN;
const ID = process.env.ID;
const BUCKET = process.env.BUCKET;
const SENDER_ID = process.env.SENDER_ID;
const APP_ID = process.env.APP_ID;
const M_ID = process.env.M_ID;

const firebaseConfig = {
    apiKey: API_KEY,
    authDomain: DOMAIN,
    projectId: ID,
    storageBucket: BUCKET,
    messagingSenderId: SENDER_ID,
    appId: APP_ID,
    measurementId: M_ID
}

// Attempt to start firestore db and check that backend server is running
try {
    const firestore = initializeApp(firebaseConfig);
    console.log("Successfully connected to DB!\n");

    app.listen(port, () => {
        console.log(`Server is running on http://localhost:${port}`);
    });
}
catch (err) {
    console.log("Connection to DB failed. ", err);
}


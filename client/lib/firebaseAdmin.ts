import admin from "firebase-admin";

if (!admin.apps.length) {
    try {
        console.log("Initializing firebase admin SDK...");

        admin.initializeApp({
            credential: admin.credential.cert({
                projectId: process.env.FIREBASE_PROJECT_ID,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
            }),
        });

        console.log("Firebase Admin intitialized succesfully");
    } catch (error) {
        console.error("Error initializing Firebase Admin SDK:", error);
    }
} else {
    console.log("Firebase Admin SDK already initialized");
}
//If you get errors, "npm install firebase-admin" on circuit-link
export default admin;
//Come back to this for credentials and stuff
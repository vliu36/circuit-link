import env from "dotenv";
import { db, bucket } from "./firebase.ts"
import app from "./app.ts";

env.config();

// Do not expose the env stuff ever!!
const port = process.env.PORT || 2400;

console.log("Attempting to start the server... ");

app.listen(port, () => {
        console.log(`Server is running on http://localhost:${port}`);
    });

if (db.databaseId) {
    console.log(`Firestore db: ${db.databaseId} successfully initialized.`)
}
else {
    console.error("ERROR: Failed to initialize database");
}

if (bucket.id) {
    console.log(`Firebase storage bucket: ${bucket.id} successfully initialized.`)
}
else {
    console.error("ERROR: Failed to initialize storage bucket");
}


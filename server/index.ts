import env from "dotenv";
import { db } from "./firebase.ts"
import app from "./app.ts";

env.config();

// Do not expose the env stuff ever!!
const port = process.env.PORT || 2400;

app.listen(port, () => {
        console.log(`Server is running on http://localhost:${port}`);
    });

if (db.databaseId) {
    console.log(`Firestore db: ${db.databaseId} successfully initialized.`)
}


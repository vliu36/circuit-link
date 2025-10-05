import express, { Request, Response } from "express";
import cors from "cors";
import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const app = express();
app.use(cors());
app.use(express.json());

// This is used to parse JSON bodies in POST requests
app.use(express.urlencoded({ extended: true }));  // To parse URL-encoded bodies


const firebaseApp = initializeApp({
    credential: applicationDefault(),
    //projectId: "circuit-link"
    projectId: "place-holder-projectId",                  // ---------------- Replaced with my personal project ID for testing purposes
});
const db = getFirestore();


// Make sure to change to proper routes afterwards
const getAllDocuments = async (req: Request, res: Response) => {
    try {
        const communitiesRef = db.collection("Users");
        const snapshot = await communitiesRef.get();
        
        res.status(200).send({
            status: "OK",
            message: snapshot.docs.map(doc => doc.data())
        })
    }
    catch (err) {
        console.log(err);
        res.status(500).send({
            status: "backend error",
            message: err
        })
    }
        
}

/** This function handles POST requests to add a new document to the "Users" collection in Firestore.
 *  It expects a JSON body with "name" and "email" fields.
 * On success, it responds with a status of 200 and a confirmation message.
 * On failure, it responds with a status of 500 and an error message.
 * @param req - The request object containing the JSON body with "name" and "email" fields.
    * @param res - The response object used to send back the status and message.
    * @returns void
    * @throws Will throw an error if there is an issue adding the document to Firestore.
    * @throws Will throw an error if there is an issue adding the document to Firestore.
    * @example
    * // Example request body:
    * {
    *   "name": "John Doe",
    *   "email": "johndoe@example.com"
    * }
    * // Example response on success:
    * {
    *   "status": "OK",
    *   "message": "Added John Doe to the database"
    * }
    * // Example response on failure:       
    * {
    *  "status": "backend error",
    *  "message": "Error details"
    * }
 */
const postDocument = async (req: Request, res: Response) => {
    try {
        const { name, email } = req.body;
        console.log("Hello ", name);
        const docRef = await db.collection("Users").add({ name, email });
        res.status(200).send({
            status: "OK",
            message: `Added ${name} to the database`
        });
    }
    catch (err) {
        console.log(err);
        res.status(500).send({
            status: "backend error",
            message: err
        });
    }
}

/** Delete document by email address
 *  This function handles DELETE requests to remove a document from the "Users" collection in Firestore based on the provided email address.
 *  It expects a JSON body with an "email" field.
 *  On success, it responds with a status of 200 and a confirmation message.
 * On failure, it responds with a status of 500 and an error message.
 * @param req - The request object containing the JSON body with the "email" field.
 * @param res - The response object used to send back the status and message.
 * @returns void
 * @throws Will throw an error if there is an issue deleting the document from Firestore.
 * @example
 * // Example request body:
 * {
 *   "email": "example@example.com"
    * }
    * // Example response on success:
    * {
    *   "status": "OK",
    *   "message": "Deleted user(s) with email:
    *  example@example.com"
    * }
    * // Example response on failure:
    * {
    *  "status": "backend error",
    *  "message": "Error details"
    * }
    * // Example usage:
    * fetch('http://localhost:2400/api/delete', {
    *   method: 'DELETE',
    *   headers: {
    *     'Content-Type': 'application/json',
    *   },
    *   body: JSON.stringify({ email: 'example@example.com' }),
    * })
    * .then(response => response.json())
    * .then(data => console.log(data))
    * .catch(error => console.error('Error:', error));
    * 
 * */ 
const deleteDocument = async (req: Request, res: Response) => {
    try {
        const { email } = req.body;
        console.log("Deleting user with email: ", email);

        const usersRef = db.collection("Users");
        const snapshot = await usersRef.where("email", "==", email).get();

        if (snapshot.empty) {
            res.status(404).send({
                status: "Not Found",
                message: `No user found with email: ${email}`
            });
            return;
        }

        snapshot.forEach(doc => {
            doc.ref.delete();
        });

        res.status(200).send({
            status: "OK",
            message: `Deleted user(s) with email: ${email}`
        });
    } catch (err) {
        console.log(err);
        res.status(500).send({
            status: "backend error",
            message: err
        });
    }
}

app.delete("/api/delete", deleteDocument);
//app.post("/api/delete", deleteDocument);
app.post("/api/post", postDocument);
app.get("/api/all", getAllDocuments);

export default app;

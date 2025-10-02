import express, { Request, Response } from "express";
import cors from "cors";
import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const app = express();
app.use(cors());
app.use(express.json());


const firebaseApp = initializeApp({
    credential: applicationDefault(),
    projectId: "circuit-link"
});
const db = getFirestore();

// Make sure to change to proper routes afterwards
const getAllDocuments = async (req: Request, res: Response) => {
    try {
        const communitiesRef = db.collection("Communities");
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

app.get("/api/all", getAllDocuments);

export default app;
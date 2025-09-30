import express, { Request, Response } from "express";
import cors from "cors";
import { getFirestore, collection, query, getDocs } from "firebase/firestore";

const app = express();
app.use(cors());
app.use(express.json());

// TODO: Make a temporary route for the data modeling assignment
// Make sure to change to modular routes afterwards
const getAllDocuments = async (req: Request, res: Response) => {
    try {
        const db = getFirestore();
        const communitiesRef = collection(db, "Communities");

        const q = query(communitiesRef);
        const snapshot = await getDocs(q);
        
        res.status(200).send({
            status: "OK",
            message: snapshot.docs.map(doc => doc.data())
        })
    }
    catch (err) {
        res.status(500).send({
            status: "backend error",
            message: err
        })
    }
        
}

app.get("/api/all", getAllDocuments);

export default app;
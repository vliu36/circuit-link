import express from "express";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

// TODO: Make a temporary route for the data modeling assignment
// Make sure to change to modular routes afterwards

export default app;
import * as replies from "../controllers/replies.ts";
import express, { Request, Response } from "express";

const router = express.Router();

/** Retrieve all documents in Replies
 *  @route GET /api/replies/all
 */
router.get("/all", replies.getAllDocuments)

export default router;
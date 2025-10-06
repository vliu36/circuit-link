import * as posts from "../controllers/posts.ts";
import express, { Request, Response } from "express";

const router = express.Router();

/** Retrieve all documents in Posts
 *  @route GET /api/posts/all
 */
router.get("/all", posts.getAllDocuments)

export default router;
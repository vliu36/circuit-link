import * as forums from "../controllers/forums.ts";
import express, { Request, Response } from "express";

const router = express.Router();

/** Retrieve all documents in Forums
 *  @route GET /api/forums/all
 */
router.get("/all", forums.getAllDocuments)

export default router;
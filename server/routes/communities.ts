import * as comm from "../controllers/communities.ts";
import express, { Request, Response } from "express";

const router = express.Router();

/** Retrieve all documents in Communities
 *  @route GET /api/comm/all
 */
router.get("/all", comm.getAllDocuments)

export default router;
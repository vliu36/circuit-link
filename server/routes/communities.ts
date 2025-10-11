import * as comm from "../controllers/communities.ts";
import express, { Request, Response } from "express";

const router = express.Router();

/** Retrieve all documents in Communities
 *  @route GET /api/comm/all
 */
router.get("/all", comm.getAllDocuments);

/** Retrieve documents in Communities that contain the prefix value
 *  @route GET /api/comm/search/:query
 *  @param query - String to use in the prefix search
*/
router.get("/search/:query", comm.prefixSearch);

export default router;
import * as users from "../controllers/users.ts";
import express, { Request, Response } from "express";

const router = express.Router();

/** Retrieve all documents in Users
 *  @route GET /api/users/all
 */
router.get("/all", users.getAllDocuments)

export default router;
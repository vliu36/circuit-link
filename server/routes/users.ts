import * as users from "../controllers/users.ts";
import express, { Request, Response } from "express";

const router = express.Router();

/** Retrieve all documents in Users
 *  @route GET /api/users/all
 */
router.get("/all", users.getAllDocuments)

/** Registers a new user by creating a new document in Users
 *  @route POST /api/users/register
 */
router.post("/register", users.userRegistration)
//router.post("/login", users.userLogin)

export default router;


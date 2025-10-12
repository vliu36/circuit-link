import * as users from "../controllers/users.ts";
import express, { Request, Response } from "express";

const router = express.Router();

/** Retrieve all documents in Users
 *  @route GET /api/users/all
 */
router.get("/all", users.getAllDocuments);

/** Registers a new user by creating a new document in Users
 *  @route POST /api/users/register
 */
router.post("/register", users.userRegistration)

/** Sets up a new user who signed in with Google by creating a new document in Users
 *  @route POST /api/users/register-google
 */
router.post("/register-google", users.setupGoogleUser)

/** Deletes a user document from Users
 *  @route DELETE /api/users/delete/:uid
 */
router.delete("/delete/:uid", users.deleteUserDocument)

export default router;


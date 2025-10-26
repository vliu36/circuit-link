import * as users from "../controllers/users.ts";
import express, { Request, Response } from "express";

const router = express.Router();

/** Retrieve all documents in Users
 *  @route GET /api/users/all
 */
router.get("/all", users.getAllDocuments);

/** Registers a new user by creating a new document in Users
 *  @route POST /api/users/register
 *  @body email - The email provided by the user
 *  @body password - The password provided by the user
 *  @body username - The username provided by the user
 *  @returns JSON containing a success message with the new user's id, or an error message
 */
router.post("/register", users.userRegistration)

/** Sets up a new user who signed in with Google by creating a new document in Users
 *  @route POST /api/users/register-google
 *  @body email - The email provided by the user
 *  @body username - The username generated from frontend
 *  @returns JSON containing a success message with the new user's id, or an error message
 */
router.post("/register-google", users.setupGoogleUser)

/** Deletes a user document from Users
 *  @route DELETE /api/users/delete/:uid
 *  @params uid - The id of the User to be deleted
 */
router.delete("/delete/:uid", users.deleteUserDocument)

export default router;


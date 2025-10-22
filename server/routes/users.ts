import * as users from "../controllers/users.ts";
import express, { Request, Response } from "express";

const router = express.Router();

/** Retrieve all documents in Users
 *  @route GET /api/users/all
 */
router.get("/all", users.getAllDocuments);

/** Registers a new user in Firebase Authentication and Firestore
 *  @route POST /api/users/register
 *  @body email - String representing the user's email address
 *  @body password - String representing the user's chosen password
 *  @body username - String representing the user's chosen display name
 *  @returns {Object} JSON object containing the user's UID and success message, or an error
 */
router.post("/register", users.userRegistration);

/** Logs in a user with an existing Firebase ID token and creates a session cookie
 *  @route POST /api/users/login
 *  @body idToken - String representing the Firebase Authentication ID token
 *  @returns {Object} Success message upon session creation, or an error if token is invalid or missing
 */
router.post("/login", users.userLogin);

/** Logs out the current user by clearing the session cookie
 *  @route POST /api/users/logout
 *  @cookie session - Firebase session cookie to be cleared
 *  @returns {Object} Success message confirming logout, or an error if clearing fails
 */
router.post("/logout", users.logoutUser);

/** Sets up or logs in a user authenticated via Google Sign-In
 *  @route POST /api/users/register-google
 *  @body idToken - String representing the Google Firebase ID token
 *  @body photoURL - String containing the user's Google profile image URL
 *  @returns {Object} User data and success message if registration or login succeeds, or an error
 *  @notes 
 *   - Verifies the provided Google token with Firebase Admin SDK  
 *   - Creates a new Firestore user document if one does not already exist  
 *   - Creates a secure session cookie for authenticated access  
 */
router.post("/register-google", users.setupGoogleUser);

/** Retrieves the currently signed-in user's data using a Firebase session cookie
 *  @route GET /api/users/me
 *  @cookie session - Firebase session cookie used for authentication
 *  @returns {Object} Combined Auth and Firestore user data if session is valid, or an error if unauthorized
 */
router.get("/me", users.getCurrentUser);

/** Deletes the authenticated user's account and associated Firestore document
 *  @route DELETE /api/users/delete
 *  @header Authorization - Bearer token containing Firebase ID token
 *  @returns {Object} Confirmation message and deleted UID, or an error if deletion fails
 */
router.delete("/delete-account", users.deleteUserAccount);

/** Updates a user's profile information in Firestore and Firebase Authentication
 *  @route PUT /api/users/edit
 *  @header Authorization - Bearer token containing Firebase ID token
 *  @body username - (optional) String representing the user's new display name
 *  @body profileDesc - (optional) String representing the user's profile description
 *  @body textSize - (optional) Number defining the user's preferred text size
 *  @body font - (optional) String defining the user's preferred font
 *  @body darkMode - Boolean defining whether dark mode is enabled
 *  @body privateMode - Boolean defining whether the user's profile is private
 *  @body restrictedMode - Boolean defining whether restricted mode is active
 *  @returns {Object} Success message upon successful update, or an error if update fails
 */
router.post("/edit-profile", users.editProfile);

export default router;


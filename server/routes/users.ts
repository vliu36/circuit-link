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
router.post("/register-google", users.userRegistrationGoogle);

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

/** Deletes the authenticated user's account and associated Firestore document
 *  @route DELETE /api/users/delete
 *  @header Authorization - Bearer token containing Firebase ID token
 *  @returns {Object} Confirmation message and deleted UID, or an error if deletion fails
 */
router.delete("/delete-account", users.deleteDoc);

/** Updates a user's profile information in Firestore and Firebase Authentication
 *  @route PUT /api/users/edit-profile
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

/** Retrieves the currently signed-in user's data using a Firebase session cookie
 *  @route GET /api/users/me
 *  @cookie session - Firebase session cookie used for authentication
 *  @returns {Object} Combined Auth and Firestore user data if session is valid, or an error if unauthorized
 */
router.get("/me", users.getCurrentUser);

/** Retrieves a user's data by their UID
 *  @route GET /api/users/get/:uid
 *  @param uid - The UID of the user to retrieve
 *  @returns {Object} User data if found, or an error message if not found
 */
router.get("/get/:uid", users.getUserById);

/** Updates the communities field of a User 
 *  @route PATCH /api/users/update-comm/:uid
 *  @body mode - Boolean value where true = add, false = remove
 *  @body community - Document id for community to add or remove
*/
router.patch("/update-comm/:uid", users.updateCommunityField)

/** Send a friend request from one user to another
 *  @route POST /api/users/friend-request
 *  @body senderId - UID of the user sending the friend request
 *  @body recipientId - UID of the user receiving the friend request
 */
router.post("/friend-request", users.sendFriendRequest);

/** Respond to a friend request (accept or decline)
 *  @route POST /api/users/respond-friend-request
 *  @body senderId - UID of the user who sent the friend request
 *  @body recipientId - UID of the user responding to the friend request
 *  @body accept - Boolean indicating whether to accept (true) or decline (false) the request
 */
router.post("/respond-friend-request", users.respondToFriendRequest);

/** Remove a friend from the user's friend list
 *  @route POST /api/users/remove-friend
 *  @body userId - UID of the user removing the friend
 *  @body friendId - UID of the friend to be removed
 */
router.post("/remove-friend", users.removeFriend);

export default router;

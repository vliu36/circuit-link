import * as forums from "../controllers/forums.ts";
import express, { Request, Response } from "express";

const router = express.Router();

/** Retrieve all documents in Forums
 *  @route GET /api/forums/all
 */
router.get("/all", forums.getAllDocuments)

/** Create a document in Forums
 *  @route POST /api/forums/create
 *  @body name - The name of the forum being made
 *  @body description - A description of the forum
 *  @body userId - The user ID of the user making the request
 */
router.post("/create", forums.addDoc);

/** Retrieve a forum by its slug within a specified community
 *  @route GET /api/forums/get/:commName/:forumSlug
 *  @param commName - The name of the community the forum belongs to
 *  @param forumSlug - The slug of the forum to retrieve
 */
router.get("/get/:commName/:forumSlug", forums.getForumBySlug);

/** Delete a forum by its ID
 *  @route DELETE /api/forums/delete/:forumId
 *  @param forumId - The ID of the forum to delete
 */
router.delete("/delete/:forumId", forums.deleteForum);

/** Edit a forum
 * @route PUT /api/forums/edit/:forumId
 * @param forumId - The ID of the forum to edit
 * @body name - The new name of the forum
 * @body description - The new description of the forum
 * @returns {200} - Forum successfully edited
 * @returns {400} - Missing required fields
 * @returns {401} - Unauthorized (invalid or missing session cookie)
 * @returns {403} - Forbidden (user is not the community owner)
 * @returns {404} - Forum not found
 * @returns {500} - Backend failure
 */
router.put("/edit/:forumId", forums.editForum);

export default router;
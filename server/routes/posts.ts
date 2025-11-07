import * as posts from "../controllers/posts.ts";
import express, { Request, Response } from "express";

const router = express.Router();

/** Retrieve all documents in Posts
 *  @route GET /api/posts/all
 *  @returns Array containing JSON objects of all documents in the collection, or an error
 */
router.get("/all", posts.getAllDocuments)

/** Creates and adds a document to Posts
 *  @route POST /api/posts/make-post
 *  @body author - The document id for the User that created the post
 *  @body title - String representing the title of the post
 *  @body contents - String representing the contents of the post (can be text or a url to the cloud storage location of the media)
*/
router.post("/make-post", posts.addDoc);

/** Adds a reply to an existing post
 *  @route PATCH /api/posts/reply/:id
 *  @param id - The document id of the post
 *  @body replyId - The document id of the reply
*/
router.patch("/reply/:id", posts.replyToPost);

/** Edits a post
 *  @route PUT /api/posts/edit/:id
 *  @params id - The id of the document to be edited
 *  @body userId - The uid for the User that created the post who is requesting an edit
 *  @body title - String representing the new title of the post
 *  @body contents - String representing the new contents of the post (can be text or a url to the cloud storage location of the media)
 *  @returns JSON object confirming the success of the edit, or an error
*/
router.put("/edit/:id", posts.editDoc);

/** Deletes a post
 *  @route DELETE /api/posts/delete/:id
 *  @params id - The id of the document to be edited
 *  @body userId - The uid of the User requesting deletion of the post
 *  @body communityId - The id of the Community that the post belongs in (This will be changed once forums are implemented)
 *  @returns JSON object confirming the success of the deletion, or an error
 */
router.delete("/delete/:id", posts.deleteDoc);

/** Likes/Dislikes a post
 *  @route POST /api/posts/vote
 *  @body postId - Id of the post that is being voted
 *  @body userId - Id of the user that is voting
 *  @body type - Type of vote the user is casting (yay/nay)
 */
router.post("/vote", posts.votePost);

/** Gets a post by its id
 *  @route GET /api/posts/get/:id
 *  @params id - The id of the document to be edited
 */
router.get("/get/:id", posts.getPostById);

export default router;
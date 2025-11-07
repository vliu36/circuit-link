import * as replies from "../controllers/replies.ts";
import express, { Request, Response } from "express";

const router = express.Router();

/** Retrieve all documents in Replies
 *  @route GET /api/replies/all
 */
router.get("/all", replies.getAllDocuments)

/** Creates and adds a document to Replies
 *  @route POST /api/replies/
 *  @body author - The document id for the User that created the reply
 *  @body contents - String representing the contents of the reply (can be text or a url to the cloud storage location of the media)
*/
router.post("/", replies.createReply)

/** Adds a reply to an existing reply
 *  @route PATCH /api/replies/reply/:id
 *  @param id - The document id of the reply that is being replied to
 *  @body replyId - The document id of the reply that is being added to the reply
*/
router.patch("/reply/:id", replies.replyToReply);

/** Likes/Dislikes a post
 *  @route POST /api/replies/vote
 *  @body postId - Id of the post that is being voted
 *  @body userId - Id of the user that is voting
 *  @body type - Type of vote the user is casting (yay/nay)
 */
router.post("/vote", replies.voteReply);

/** Edits a reply
 *  @route PUT /api/replies/edit/:replyId
 *  @params replyId - The document id of the reply that is being edited
 *  @body contents - The new contents of the reply
 *  @body userId - The id of the user that is deleting the post
 *  @returns JSON object confirming the success of the edit, or an error
 */
router.put("/edit/:replyId", replies.editDoc);

/** Deletes a reply
 *  @route DELETE /api/replies/delete/:replyId
 *  @params replyId - The document id of the post that is being deleted
 *  @body userId - The id of the user that is deleting the post
 *  @body communityId - The id of the Community that the post belongs in (This will be changed once forums are implemented)
 *  @returns JSON object confirming the success of the deletion, or an error
 */
router.delete("/delete/:replyId", replies.deleteDoc);


export default router;
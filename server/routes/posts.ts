import * as posts from "../controllers/posts.ts";
import express, { Request, Response } from "express";

const router = express.Router();

/** Retrieve all documents in Posts
 *  @route GET /api/posts/
 *  @returns Array containing JSON objects of all documents in the collection, or an error
 */
router.get("/all", posts.getAllDocuments)

/** Creates and adds a document to Posts
 *  @route POST /api/posts/
 *  @body author - The document id for the User that created the post
 *  @body title - String representing the title of the post
 *  @body contents - String representing the contents of the post (can be text or a url to the cloud storage location of the media)
*/

/** Creates and adds a document to Posts
 *  @route POST /api/posts/
 *  @body author - The document id for the User that created the post
 *  @body title - String representing the title of the post
 *  @body contents - String representing the contents of the post (can be text or a url to the cloud storage location of the media)
*/
router.post("/make-post", posts.addDoc);

export default router;
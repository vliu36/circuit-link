import * as messages from "../controllers/messages.ts";
import express, { Request, Response } from "express";

const router = express.Router();

/** Retrieve all documents in Forums
 *  @route GET /api/messages/all
 */
router.get("/all", messages.getAllMessages);

/** Creates a new message and adds it to the collection
 *  @route POST /api/messages/create
 *  @body author - The uid of the author of the message (string)
 *  @body contents - The text contents of the message (string)
 *  @body media - (optional) The url of the media location in Firebase Storage (string)
 *  @body receiver - The uid of the message recipient (if isDirect == 1), otherwise the name of the community (if isDirect != 1)
 *  @body isDirect - Is the message a direct message? (0 = false, 1 = true)
 */
router.post("/create", messages.addMessage);

/** Retrieves a list of messages up to the given timestamp 
 *  @route GET /api/messages/getBefore/:receiver/:isDirect/:time
 *  @param receiver - The uid of the message recipient (if isDirect == 1), otherwise the name of the community (if isDirect != 1)
 *  @param isDirect - Is the message a direct message? (0 = false, 1 = true)
 *  @param time - Date timestamp of the time to retrieve messages up to
*/
router.get("/getBefore/:receiver/:isDirect/:time", messages.getChatBeforeTime);

/** Retrieves a list of messages between the given timestamps
 *  @route GET /api/messages/getBetween/:receiver/:isDirect/:afterTime/:beforeTime
 *  @param receiver - The uid of the message recipient (if isDirect == 1), otherwise the name of the community (if isDirect != 1)
 *  @param isDirect - Is the message a direct message? (0 = false, 1 = true)
 *  @param afterTime - Date timestamp of the time to retrieve messages after or equal to
 *  @param beforeTime - Date timestamp of the time to retrieve messages before or equal to
 */
router.get("/getBetween/:receiver/:isDirect/:afterTime/:beforeTime", messages.getChatBetweenTime);

export default router;

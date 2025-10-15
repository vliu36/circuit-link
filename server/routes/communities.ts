import * as comm from "../controllers/communities.ts";
import express, { Request, Response } from "express";

const router = express.Router();

/** Retrieve all documents in Communities
 *  @route GET /api/comm/all
 *  @returns Array containing JSON objects of all documents in the collection, or an error
 */
router.get("/all", comm.getAllDocuments);

/** Retrieve documents in Communities that contain the prefix value
 *  @route GET /api/comm/search/:query
 *  @param query - String to use in the prefix search
 *  @returns Array containing JSON objects of documents with a matching prefix, or an empty array, or an error
*/
router.get("/search/:query", comm.prefixSearch);

/** Creates and adds a document to Communities
 *  @route POST /api/comm/add
 *  @body blacklist - Array of Users to be blacklisted (can be empty)
 *  @body description = String representing the user defined description for the Community
 *  @body groups - Array of Groups in the Community (can be empty)
 *  @body modList - Array of Users to be granted moderate privileges (must at least contain owner)
 *  @body name = String representing the name of the Community (must be unique)
 *  @body ownerList - Array of Users who are owners of the Community (must at least contain owner)
 *  @body public - Boolean (true/false) defining whether or not the Community is public
 *  @body userList - Array of Users who follow the Community (must at least contain owner)
 *  @returns The newly created document, or an error
*/
router.post("/add", comm.addDoc);

/** Retrieves documents in Communities that match the exact name
 *  @route GET /api/comm/get/:name
 *  @param name - String to search for
 *  @returns JSON Object of the matching document, or an error
 */
router.get("/get/:name", comm.getDocByName);

export default router;
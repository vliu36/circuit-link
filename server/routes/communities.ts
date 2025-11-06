import * as comm from "../controllers/communities.ts";
import express, { Request, Response } from "express";

const router = express.Router();

/** Retrieve all documents in Communities
 *  @route GET /api/comm/
 *  @returns Array containing JSON objects of all documents in the collection, or an error
 */
router.get("/", comm.getAllDocuments);

/** Retrieve documents in Communities that contain the prefix value
 *  @route GET /api/comm/search/:query
 *  @param query - String to use in the prefix search
 *  @returns Array containing JSON objects of documents with a matching prefix, or an empty array, or an error
*/
router.get("/search/:query", comm.prefixSearch);

// /** Creates and adds a document to Communities
//  *  @route POST /api/comm/
//  *  @body blacklist - Array of Users (document reference) to be blacklisted (can be empty)
//  *  @body description = String representing the user defined description for the Community
//  *  @body groups - Array of Groups (document reference) in the Community (can be empty)
//  *  @body modList - Array of Users (document reference) to be granted moderate privileges (must at least contain owner)
//  *  @body name = String representing the name of the Community (must be unique)
//  *  @body ownerList - Array of Users (document reference) who are owners of the Community (must at least contain owner)
//  *  @body public - Boolean (true/false) defining whether or not the Community is public
//  *  @body userList - Array of Users (document reference) who follow the Community (must at least contain owner)
//  *  @returns The newly created document, or an error
// */
// router.post("/", comm.addDoc);

// ^^^ Modified of above ^^^
/** Creates and adds a document to Communities, with a default Group
 *  @route POST /api/comm/create
 *  @body name - String representing the name of the Community (must be unique)
 *  @body description - String representing the user defined description for the Community
 *  @body userId - String of the user ID of the user creating the community
 *  @body publicity - Boolean determining whether the community is public or not
 */
router.post("/create", comm.addDoc);

/** Retrieves documents in Communities that match the exact name
 *  @route GET /api/comm/get/:name
 *  @param name - String to search for
 *  @returns JSON Object of the matching document, or an error
 */
router.get("/get/:name", comm.getDocByName);

/** Retrieves the document in Communities as well as all Group and Forum documents that match the name
 *  @route GET /api/comm/get-structure/:name
 *  @param name - String to search for
 *  @returns JSON Object of the matching document, or an error
 */
router.get("/get-structure/:name", comm.getCommunityStructure);

/** Deletes a document in Communities
 *  @route DELETE /api/comm/delete
 *  @body name - String name of the community to be deleted
 *  @body userId - String ID of the user requesting the deletion of a community
 */
router.delete("/delete", comm.deleteDoc);

/** Creates a Group in Communities
 *  @route POST /api/comm/create-group
 *  @body commName - Name of the community in which the group belongs in 
 *  @body name - Name of the group being created
 *  @body userId - String ID of the user requesting the creation of a group
 */
router.post("/create-group", comm.createGroup);

/** Deletes a Group in Communities
 *  @route DELETE /api/comm/delete-group/:id
 *  @param id - ID of the group to be deleted
 */
router.delete("/delete-group/:groupId", comm.deleteGroup);

export default router;
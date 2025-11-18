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

/** Creates and adds a document to Communities, with a default Group
 *  @route POST /api/comm/create
 *  @body name - String representing the name of the Community (must be unique)
 *  @body description - String representing the user defined description for the Community
 *  @body isPublic - Boolean determining whether the community is public or not
 *  @cookie session - Firebase session cookie used to authenticate the request
 *  @returns JSON Object of the created document, or an error
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
 *  @param name - String name of the community to be deleted
 *  @cookie session - Firebase session cookie used to authenticate the request
 *  @returns JSON Object indicating success or an error
 */
router.delete("/delete/:name", comm.deleteDoc);

/** Creates a Group in Communities
 *  @route POST /api/comm/create-group
 *  @body commName - Name of the community in which the group belongs in 
 *  @body name - Name of the group being created
 *  @cookie session - Firebase session cookie used to authenticate the request (must be an owner)
 *  @returns JSON Object indicating success or an error
 */
router.post("/create-group", comm.createGroup);

/** Deletes a Group in Communities
 *  @route DELETE /api/comm/delete-group/:id
 *  @param groupId - ID of the group to be deleted
 *  @body commName - Name of the community in which the group belongs in
 *  @cookie session - Firebase session cookie used to authenticate the request
 *  @returns JSON Object indicating success or an error
 */
router.delete("/delete-group/:groupId", comm.deleteGroup);

/** User joins a community by name
 *  @route POST /api/comm/join/:name
 *  @params name - String representing the name of the Community
 *  @cookie session - Firebase session cookie used to authenticate the request
 *  @returns JSON Object with success message, or an error
 */
router.post("/join/:name", comm.joinCommunity);

/** User leaves a community by name
 *  @route POST /api/comm/leave/:name
 *  @params name - String representing the name of the Community
 *  @cookie session - Firebase session cookie used to authenticate the request
 *  @returns JSON Object with success message, or an error
 */
router.post("/leave/:name", comm.leaveCommunity);

/** Promote a user to moderator
 *  @route POST /api/comm/promote-mod/:name
 *  @params name - String representing the name of the Community
 *  @body userId - UID of the user to be promoted
 *  @cookie session - Firebase session cookie used to authenticate the request (must be an owner)
 *  @returns JSON Object with success message, or an error
 */
router.post("/promote-mod/:name", comm.promoteToMod);

/** Demote a user from moderator
 *  @route POST /api/comm/demote-mod/:name
 *  @params name - String representing the name of the Community
 *  @body userId - UID of the user to be demoted
 *  @cookie session - Firebase session cookie used to authenticate the request (must be an owner)
 *  @returns JSON Object with success message, or an error
 */
router.post("/demote-mod/:name", comm.demoteMod);

/** Promote a user to owner
 *  @route POST /api/comm/promote-owner/:name
 *  @params name - String representing the name of the Community
 *  @body userId - UID of the user to be promoted
 *  @cookie session - Firebase session cookie used to authenticate the request (must be an owner)
 *  @returns JSON Object with success message, or an error
 */
router.post("/promote-owner/:name", comm.promoteToOwner);

/** Demote a user from owner
 *  @route POST /api/comm/demote-owner/:name
 *  @params name - String representing the name of the Community
 *  @body userId - UID of the user to be demoted
 *  @cookie session - Firebase session cookie used to authenticate the request (must be an owner)
 *  @returns JSON Object with success message, or an error
 */
router.post("/demote-owner/:name", comm.demoteOwner);

/** Edit community details
 *  @route PUT /api/comm/edit/:name
 *  @params name - String representing the name of the Community
 *  @body newName - New name for the community (optional)
 *  @body description - New description for the community (optional)
 *  @body isPublic - New public status for the community (optional)
 *  @cookie session - Firebase session cookie used to authenticate the request (must be an owner)
 *  @returns JSON Object indicating success or an error
 */
router.put("/edit/:name", comm.editComm);

/** Edit group details
 *  @route PUT /api/comm/edit-group/:groupId
 *  @params groupId - ID of the group to be edited
 *  @body commName - Name of the community in which the group belongs in
 *  @body newName - New name for the group 
 *  @cookie session - Firebase session cookie used to authenticate the request (must be an owner)
 *  @returns JSON Object indicating success or an error
 */
router.put("/edit-group/:groupId", comm.editGroup);

/** Kick a user from the community
 *  @route POST /api/comm/kick-user/:name
 *  @params name - String representing the name of the Community
 *  @body userId - UID of the user to be kicked
 *  @cookie session - Firebase session cookie used to authenticate the request (must be an owner or mod)
 *  @returns JSON Object with success message, or an error
 */
router.post("/kick-user/:name", comm.kickUser);

/** Unban a user from the community
 *  @route POST /api/comm/unban-user/:name
 *  @params name - String representing the name of the Community
 *  @body userId - UID of the user to be unbanned
 *  @cookie session - Firebase session cookie used to authenticate the request (must be an owner or mod)
 *  @returns JSON Object with success message, or an error
 */
router.post("/unban-user/:name", comm.unbanUser);

/** Get the blacklist of a community
 *  @route GET /api/comm/blacklist/:name
 *  @params name - String representing the name of the Community
 *  @cookie session - Firebase session cookie used to authenticate the request (must be an owner or mod)
 *  @returns JSON Object containing an array of blacklisted users, or an error
 */
router.get("/blacklist/:name", comm.getBlacklist);

/** Report a post in a community
 *  @route POST /api/comm/report-post
 *  @body commName - Name of the community where the post is located
 *  @body postId - ID of the post being reported
 *  @body reason - Reason for reporting the post
 *  @cookie session - Firebase session cookie used to authenticate the request
 *  @returns JSON Object indicating success or an error
 */
router.post("/report-post", comm.reportPost);

export default router;
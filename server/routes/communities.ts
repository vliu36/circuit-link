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
 *  @returns {201} - Community successfully created
 *  @returns {400} - Community already exists
 *  @returns {500} - Backend failure
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
 *  @returns {200} - Community successfully deleted
 *  @returns {401} - Unauthorized (invalid or missing session cookie)
 *  @returns {403} - Forbidden (user is not the community owner)
 *  @returns {404} - Community not found
 */
router.delete("/delete/:name", comm.deleteDoc);

/** Creates a Group in Communities
 *  @route POST /api/comm/create-group
 *  @body commName - Name of the community in which the group belongs in 
 *  @body name - Name of the group being created
 *  @body userId - String ID of the user requesting the creation of a group
 */
router.post("/create-group", comm.createGroup);

/** Deletes a Group in Communities
 *  @route DELETE /api/comm/delete-group/:id
 *  @param groupId - ID of the group to be deleted
 *  @body commName - Name of the community in which the group belongs in
 *  @cookie session - Firebase session cookie used to authenticate the request
 *  @returns {200} - Group successfully deleted
 *  @returns {400} - Missing parameters
 *  @returns {401} - Unauthorized (invalid or missing session cookie)
 *  @returns {403} - Forbidden (user is not the community owner)
 *  @returns {404} - Group not found
 *  @returns {500} - Backend failure
 */
router.delete("/delete-group/:groupId", comm.deleteGroup);

/** User joins a community by name
 *  @route POST /api/comm/join/:name
 *  @params name - String representing the name of the Community
 *  @cookie session - Firebase session cookie used to authenticate the request
 *  @returns {200} - User successfully joined the community
 *  @returns {400} - Missing parameters or user already a member
 *  @returns {404} - Community or user not found
 *  @returns {500} - Backend failure
 */
router.post("/join/:name", comm.joinCommunity);

/** User leaves a community by name
 *  @route POST /api/comm/leave/:name
 *  @params name - String representing the name of the Community
 *  @cookie session - Firebase session cookie used to authenticate the request
 *  @returns {200} - User successfully left the community
 *  @returns {400} - Missing parameters or user cannot leave (e.g., only owner)
 *  @returns {404} - Community or user not found
 *  @returns {500} - Backend failure
 */
router.post("/leave/:name", comm.leaveCommunity);

/** Promote a user to moderator
 *  @route POST /api/comm/promote-mod/:name
 *  @params name - String representing the name of the Community
 *  @body userId - UID of the user to be promoted
 *  @cookie session - Firebase session cookie used to authenticate the request (must be an owner)
 *  @returns {200} - User successfully promoted to mod
 *  @returns {400} - Missing parameters or target is not a member
 *  @returns {403} - Requester is not an owner
 *  @returns {404} - Community or user not found
 *  @returns {500} - Backend failure
 */
router.post("/promote-mod/:name", comm.promoteToMod);

/** Demote a user from moderator
 *  @route POST /api/comm/demote-mod/:name
 *  @params name - String representing the name of the Community
 *  @body userId - UID of the user to be demoted
 *  @cookie session - Firebase session cookie used to authenticate the request (must be an owner)
 *  @returns {200} - User successfully demoted from mod
 *  @returns {400} - Missing parameters or target is not a mod
 *  @returns {403} - Requester is not an owner
 *  @returns {404} - Community or user not found
 *  @returns {500} - Backend failure
 */
router.post("/demote-mod/:name", comm.demoteMod);

/** Promote a user to owner
 *  @route POST /api/comm/promote-owner/:name
 *  @params name - String representing the name of the Community
 *  @body userId - UID of the user to be promoted
 *  @cookie session - Firebase session cookie used to authenticate the request (must be an owner)
 *  @returns {200} - User successfully promoted to owner
 *  @returns {400} - Missing parameters or target is not a member
 *  @returns {403} - Requester is not an owner
 *  @returns {404} - Community or user not found
 *  @returns {500} - Backend failure
 */
router.post("/promote-owner/:name", comm.promoteToOwner);

/** Demote a user from owner
 *  @route POST /api/comm/demote-owner/:name
 *  @params name - String representing the name of the Community
 *  @body userId - UID of the user to be demoted
 *  @cookie session - Firebase session cookie used to authenticate the request (must be an owner)
 *  @returns {200} - User successfully demoted from owner
 *  @returns {400} - Missing parameters or cannot demote (e.g., only owner)
 *  @returns {403} - Requester is not an owner
 *  @returns {404} - Community or user not found
 *  @returns {500} - Backend failure
 */
router.post("/demote-owner/:name", comm.demoteOwner);

/** Edit community details
 *  @route PUT /api/comm/edit/:name
 *  @params name - String representing the name of the Community
 *  @body newName - New name for the community (optional)
 *  @body description - New description for the community (optional)
 *  @body isPublic - New public status for the community (optional)
 *  @cookie session - Firebase session cookie used to authenticate the request (must be an owner)
 *  @returns {200} - Community successfully updated
 *  @returns {400} - Missing parameters or invalid data
 *  @returns {403} - Requester is not an owner
 *  @returns {404} - Community not found
 *  @returns {409} - New community name already taken
 *  @returns {500} - Backend failure
 */
router.put("/edit/:name", comm.editComm);

export default router;
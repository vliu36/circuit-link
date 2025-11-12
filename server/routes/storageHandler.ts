import storageHandler from "../controllers/storageHandler";
import express from "express";

const router = express.Router();

/** Creates a signed URL with file upload permissions
 *  @route POST /api/storage/upload
 *  @body user - The document id for the User that is uploading the file
 *  @body extension - String representing the file extension of the file to upload (png, jpeg, etc.)
*/
router.post("/upload", storageHandler.generateUploadURL);

export default router;
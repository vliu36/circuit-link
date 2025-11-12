/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import {setGlobalOptions} from "firebase-functions";
import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getStorage } from "firebase-admin/storage";
import { HttpsError, onCall } from "firebase-functions/v2/https";

// import {onRequest} from "firebase-functions/https";
// import * as logger from "firebase-functions/logger";

// Start writing functions
// https://firebase.google.com/docs/functions/typescript

// For cost control, you can set the maximum number of containers that can be
// running at the same time. This helps mitigate the impact of unexpected
// traffic spikes by instead downgrading performance. This limit is a
// per-function limit. You can override the limit for each function using the
// `maxInstances` option in the function's options, e.g.
// `onRequest({ maxInstances: 5 }, (req, res) => { ... })`.
// NOTE: setGlobalOptions does not apply to functions using the v1 API. V1
// functions should each use functions.runWith({ maxInstances: 10 }) instead.
// In the v1 API, each function can only serve one request per container, so
// this will be the maximum concurrent request count.

initializeApp({
    credential: applicationDefault(),
    projectId: "circuit-link"
});

setGlobalOptions({ maxInstances: 10 });

const storage = getStorage();

const cloudUrl = "gs://circuit-link.firebasestorage.app";

// Cloud function to generate a url for file upload to the cloud storage bucket
export const generateUploadUrl = onCall({maxInstances: 1}, async (req) => {
    if (!req.auth) {
        throw new HttpsError("failed-precondition", "The user must be authenticated to call this function.");
    }

    const auth = req.auth;
    const data = req.data;
    const bucket = storage.bucket(`${cloudUrl}/media/images/`);

    const fileName = `${auth.uid}-${Date.now()}.${data.fileExtension}`;

    // Generate a v4 signed URL with write permissions that expires in 10 minutes
    const [url] = await bucket.file(fileName).getSignedUrl({
        version: "v4",
        action: "write",
        expires: Date.now() + 10 * 60 * 1000
    });

    return {url, fileName};
})
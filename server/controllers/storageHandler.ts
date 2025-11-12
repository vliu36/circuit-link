// Functions for facilitating client-sided cloud storage upload and download 

import { bucket } from "../firebase.ts";
import { Request, Response } from "express";

// Generates a v4 signed URL with upload permissions for 10 mins 
const generateUploadURL = async (req: Request, res: Response) => {
    try {
        const user = req.body.user;
        const fileExtension = req.body.extension;
        
        if (!user && !fileExtension) {
            res.status(400).send({
                status: "Bad Request",
                message: "Body contains empty or malformed fields"
            });
        }
        const fileName = `${user.id}-${Date.now()}.${fileExtension}`;

        const [url] = await bucket.file(fileName).getSignedUrl({
            version: "v4",
            action: "write",
            expires: Date.now() + 10 * 60 * 1000,
        });

        res.status(200).send({
            status: "OK",
            message: url
        })
    }
    catch (err) {
        console.log(err);
        res.status(500).send({
            status: "Backend error",
            message: err
        });
    }

}

export default {
    generateUploadURL
}
// Temporary page to test image functionality

"use client"

import { useState } from "react";
import { uploadImage } from "./storageHandler.ts";

export default function storageTest() {
    const [image, setImage] = useState<FileList | null>();

    const handleFileSubmission = (): void => {
        try {
            if (image) {
                const file: File = image[0];
                const cloudUrl = uploadImage(file).then((result) => {
                    console.log(result);
                })
            }
            else {
                console.log("Filelist is empty");
            }
        }
        catch (err) {
            console.error(err);
        }
    }

    return (
        <div>
            <p>Upload an Image</p>
            <input 
                type="file" 
                id="file"
                name="uploadedFile"
                accept="image/png, image/jpeg" 
                onChange={(e) => setImage(e.target.files)}
            />
            <button onClick={handleFileSubmission}>
                Upload Image
            </button>
        </div>
    )
}
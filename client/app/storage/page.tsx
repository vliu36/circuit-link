// Temporary page to test image functionality

"use client"

import { useState } from "react";
import { uploadImage } from "./storageHandler.ts";
import Image from "next/image";

export default function StorageTest() {
    const [image, setImage] = useState<FileList | null>();
    const [preview, setPreview] = useState<string>("");

    const handleFileSubmission = (): void => {
        try {
            if (image) {
                const file: File = image[0];
                setPreview(URL.createObjectURL(file));

                const cloudUrl = uploadImage(file).then((result) => {
                    console.log(result);
                    alert(result);
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
            {preview && 
            <Image src={preview} alt="Image Preview" width={1000} height={1000}/>}
        </div>
    )
}
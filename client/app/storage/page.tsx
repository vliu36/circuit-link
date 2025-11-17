
"use client"

import { useState } from "react";
import { uploadImage, uploadVideo } from "../_utils/mediaUpload.ts";
import Image from "next/image";

// export default function StorageTest() {
//     const [image, setImage] = useState<FileList | null>();
//     const [preview, setPreview] = useState<string>("");

//     const handleFileSubmission = (): void => {
//         try {
//             if (image) {
//                 const file: File = image[0];
//                 setPreview(URL.createObjectURL(file));

//                 const cloudUrl = uploadImage(file).then((result) => {
//                     console.log(result);
//                     alert(result?.url);
//                 })
//             }
//             else {
//                 console.log("Filelist is empty");
//             }
//         }
//         catch (err) {
//             console.error(err);
//         }
//     }

//     return (
//         <div>
//             <p>Upload an Image</p>
//             <input 
//                 type="file" 
//                 id="file"
//                 name="uploadedFile"
//                 accept="image/png, image/jpeg" 
//                 onChange={(e) => setImage(e.target.files)}
//             />
//             <button onClick={handleFileSubmission}>
//                 Upload Image
//             </button> 
//             {preview && 
//             <Image src={preview} alt="Image Preview" width={1000} height={1000}/>}
//         </div>
//     )
// }

export default function StorageTest() {
    const [video, setVideo] = useState<FileList | null>();
    const [preview, setPreview] = useState<string>("");

    const handleFileSubmission = (): void => {
        try {
            if (video) {
                const file: File = video[0];
                setPreview(URL.createObjectURL(file));

                const cloudUrl = uploadVideo(file).then((result) => {
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
                accept="video/mp4" 
                onChange={(e) => setVideo(e.target.files)}
            />
            <button onClick={handleFileSubmission}>
                Upload Image
            </button> 
            {preview && 
            <video controls width="1000">
                <source src={preview} type="video/mp4"/>
            </video>}
        </div>
    )
}
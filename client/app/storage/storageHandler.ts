// Functions that handle storage upload and download

import { httpsCallable, HttpsCallableResult } from "firebase/functions";
import { functions, storage } from "@/app/_firebase/firebase.ts";
import { getDownloadURL, ref } from "firebase/storage";

interface RequestData {
  fileExtension: string | undefined;
}

interface ResponseData {
  url: string;
}
const generateUploadUrlRef = httpsCallable<RequestData, ResponseData>(functions, "generateUploadUrl");

// Takes an image file and uploads it to the cloud bucket
export async function uploadImage(file: File) {
    try {
        if (file.size > 5000000) {
            throw Error("File size exceeds 5 MB!");
        }

        // Invoke the cloud function to get a signed URL
        const URLres = await generateUploadUrlRef({
            fileExtension: file.name.split('.').pop()
        });

        // Upload the file using the signed URL
        const uploadRes = await fetch(URLres.data.url, {
            method: "PUT",
            body: file,
            headers: {
                "Content-Type": file.type,
            },
        });
        
        // Extracts the filepath from the return url
        const filepath = uploadRes?.url.substring(64,123);
        return filepath;
    }
    catch (err) {
        console.error(err);
    }
}

// Takes the file name of an image in the cloud bucket and retrieves the download url
export async function downloadMediaImage(fileName: string) {
    try {
        if (fileName) {
            throw Error("Image download failed: FileName cannot be empty.");
        }

        const imageRef = ref(storage, `media/images/${fileName}`)
        const res = await getDownloadURL(imageRef).then((result) => {
            return result;
        });
    }
    catch (err) {
        return err;
    }
}

// Takes a video and uploads it to the cloud bucket
// export async function uploadVideo(file: File) {
//     try {
//         const videosRef = ref(storage, "content/videos");

//         if (file.size > 5000000) {
//             throw Error("File size exceeds 5 MB!");
//         }
//         else {
//             await convertVideo(path.resolve(file.name)).then(async () => {
//                 await uploadBytes(videosRef, file).then((result) => {
//                     console.log(result);
//                     return result;
//                 })
//             });
//         }
//     }
//     catch (err) {
//         console.error(err);
//     }
// }

// function convertVideo(filepath: string) {
//     return new Promise<void>((resolve, reject) => {
//         ffmpeg(filepath)
//             .outputOptions("-vf", "scale=-1:360")
//             .on("end", () => {
//                 console.log("Video processing finished successfully")
//                 resolve();
//             })
//             .on("error", (err) => {
//                 console.log(err);
//                 reject(err);
//             })
//             .save(filepath);
//     });
// }
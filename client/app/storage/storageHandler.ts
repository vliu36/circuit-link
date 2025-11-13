// Functions that handle storage upload and download

import { httpsCallable, HttpsCallableResult } from "firebase/functions";
import { functions } from "@/app/_firebase/firebase.ts";

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
        
        return uploadRes;
    }
    catch (err) {
        console.error(err);
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

// Download a video or image from the cloud bucket
// path: string - The relative path of the media in the firebase cloud storage bucket
// export async function downloadMedia(path: string) {
//     try {
//         const mediaRef = ref(storage, path);
//         await getBytes(mediaRef).then((result) => {
//             return result;
//         });
//     }
//     catch (err) {
//         console.error(err);
//     }
// }
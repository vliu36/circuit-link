import { storage } from "@/app/_firebase/firebase.ts";
import { getBytes, ref, uploadBytes } from "firebase/storage";
// import ffmpeg from "fluent-ffmpeg";
import path from "path";

// Takes an image and uploads it to the cloud bucket
export async function uploadImage(file: File): Promise<string | boolean> {
    try {
        if (file.size > 5000000) {
            throw Error("File size exceeds 5 MB!");
        }
        
        const imagesRef = ref(storage, "content/images");
        await uploadBytes(imagesRef, file).then((result) => {
            console.log(result);
            return result;
        });
    }
    catch (err) {
        console.error(err);
    }

    return false;
}

// Takes a video and uploads it to the cloud bucket
export async function uploadVideo(file: File) {
    try {
        const videosRef = ref(storage, "content/videos");

        if (file.size > 5000000) {
            throw Error("File size exceeds 5 MB!");
        }
        // await convertVideo(path.resolve(file.name)).then((result) => {

        // })
    }
    catch (err) {
        console.error(err);
    }
}

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
export async function downloadMedia(path: string) {
    try {
        const mediaRef = ref(storage, path);
        return await getBytes(mediaRef);
    }
    catch (err) {
        console.error(err);
    }
}
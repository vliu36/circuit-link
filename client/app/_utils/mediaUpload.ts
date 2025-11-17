// Functions that handle storage upload and download

import { httpsCallable, HttpsCallableResult } from "firebase/functions";
import { functions } from "@/app/_firebase/firebase.ts";

interface RequestData {
  fileExtension: string | undefined;
}

interface ResponseData {
  fileName: any;
  url: string;
}

// Takes an image file and uploads it to the cloud bucket
// Note that it only accepts files smaller than 5 MB!
export async function uploadImage(file: File) {
    const generateUploadUrlRef = httpsCallable<RequestData, ResponseData>(functions, "generateImagesUploadUrl");

    try {
        if (file.size > 5000000) {
            throw Error("File size exceeds 5 MB!");
        }

        // Invoke the cloud function to get a signed URL
        const URLres: HttpsCallableResult<ResponseData> = await generateUploadUrlRef({
            fileExtension: file.name.split('.').pop()
        });

        const url = URLres.data.url;
        const fileName = URLres.data.fileName;

        // Upload the file using the signed URL
        await fetch(url, {
            method: "PUT",
            body: file,
            headers: {
                "Content-Type": file.type,
            },
        });
        
        return fileName;
    }
    catch (err) {
        console.error(err);
    }
}

// Takes an video file and uploads it to the cloud bucket
// Note that it only accepts files smaller than 30 MB!
export async function uploadVideo(file: File) {
    const generateUploadUrlRef = httpsCallable<RequestData, ResponseData>(functions, "generateVideosUploadUrl");
    
    try {
        if (file.size > 30000000) {
            throw Error("File size exceeds 30 MB!");
        }

        // Invoke the cloud function to get a signed URL
        const URLres: HttpsCallableResult<ResponseData> = await generateUploadUrlRef({
            fileExtension: file.name.split('.').pop()
        });

        const url = URLres.data.url;
        const fileName = URLres.data.fileName;

        // Upload the file using the signed URL
        await fetch(url, {
            method: "PUT",
            body: file,
            headers: {
                "Content-Type": file.type,
            },
        });
        
        return fileName;
    }
    catch (err) {
        console.error(err);
    }
}


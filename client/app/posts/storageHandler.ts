import { storage } from "@/app/_firebase/firebase.ts";
import { ref, uploadBytes } from "firebase/storage";
import ffmpeg from "fluent-ffmpeg";

// Takes an image and uploads it to the cloud bucket 
function uploadImage(file: File) {
    try {
        const imagesRef = ref(storage, "content/images");
        uploadBytes(imagesRef, file).then((result) => {
            console.log(result);
        })
    }
    catch (err) {
        console.log(err);
    }
}

// Takes a video and uploads it to the cloud bucket
function uploadVideo(file: File) {
    try {
        const videosRef = ref(storage, "content/videos");
    }
    catch (err) {
        console.log(err);
    }
}

// Download a video or image from the cloud bucket
function downloadMedia(filepath: string) {

}


export default {
    uploadImage,
    uploadVideo,
    downloadMedia
}
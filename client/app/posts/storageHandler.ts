import { storage } from "@/app/_firebase/firebase.ts";
import { ref, uploadBytes } from "firebase/storage";

// Takes an image and uploads it to the cloud bucket 
function uploadImage(file: File) {
    const storageRef = ref(storage, "content/images");
    uploadBytes(storageRef, file).then((result) => {
        console.log(result);
    })
}

// Takes a video and uploads it to the cloud bucket
function uploadVideo(file: File) {

}

// Download a video or image from the cloud bucket
function downloadMedia(filepath: string) {

}


export default {
    uploadImage,
    uploadVideo,
    downloadMedia
}
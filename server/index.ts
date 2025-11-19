import env from "dotenv";
import { db, bucket } from "./firebase.ts"
import app from "./app.ts";
import { Server } from "socket.io";

env.config();

// Do not expose the env stuff ever!!
const port = process.env.PORT || 2400;

console.log("Attempting to start the server... \n");

// Creates a server instance at PORT
const httpServer = app.listen(port, () => {
        console.log(`Server is running on http://localhost:${port}\n`);
    });

// Mounts a socket instance to the server and listens for incoming updates
const io = new Server(httpServer, {
    cors: {
        origin: ["http://localhost:3000"]
    }
});

// TODO: Move into separate file
io.on("connection", (socket) => {
    console.log(`Server: ${socket.id} User Connected`);
    socket.on("disconnect", () => {
        console.log(`User disconnected`);
    });
    socket.on("chat message", (msg) => {
        console.log(`Received message: ${msg}`);
        io.emit("chat message", msg);
    })
});

// Check firebase dependencies are initialized
if (db.databaseId) {
    console.log(`Firestore db: ${db.databaseId} successfully initialized.`)
}
else {
    console.error("ERROR: Failed to initialize database");
}
if (bucket.id) {
    console.log(`Firebase storage bucket: ${bucket.id} successfully initialized.`)
}
else {
    console.error("ERROR: Failed to initialize storage bucket");
}

export default io;

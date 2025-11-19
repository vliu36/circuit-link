import { io } from "socket.io-client";

const SERVER_URL = "http://localhost:2400";
const socket = io(SERVER_URL, {
    autoConnect: false,
});

socket.onAny((event, ...args) => {
    console.log(event, args);
})

export default socket;
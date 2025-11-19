"use client"

import { useState } from "react";
import { io } from "socket.io-client";

const SERVER_URL = "http://localhost:2400";

export default function SocketTest() {
    const socket = io(SERVER_URL);
    const [message, setMessage] = useState<string>("");

    socket.on("connect", () => {
        console.log(`Client: ${socket.id} connect`);
    });

    socket.on("chat message", (msg) => {
        console.log(`Received: ${msg}`);
    })

    return (
        <div>
            <div>
                Socket Test Hello
            </div>
            <input 
                className="border 1px"
                onChange={(e) => setMessage(e.target.value)}
            />
            <button onClick={() => {
                if (message) {
                    socket.emit("chat message", message);
                    setMessage("");
                }
            }}>
                Send!
            </button>
        </div>
    )
}
import express, { Request, Response } from "express";
import cors from "cors";
import commRouter from "./routes/communities.ts";
import repliesRouter from "./routes/replies.ts";
import forumsRouter from "./routes/forums.ts";
import postsRouter from "./routes/posts.ts";
import usersRouter from "./routes/users.ts";

const app = express();
app.use(cors({
    origin: "http://localhost:3000",
    credentials: true,
}));
app.use(express.json());

// Routes
app.use("/api/comm", commRouter)
app.use("/api/replies", repliesRouter)
app.use("/api/forums", forumsRouter)
app.use("/api/posts", postsRouter)
app.use("/api/users", usersRouter)

export default app;
// General utilities for controllers
import { Request } from "express";
import { DocumentReference, Timestamp } from "firebase-admin/firestore";



// Function to assist in parsing session cookie
export function cookieParser(req: Request): Record<string, string> {
    // Extract and parse cookies
    const cookieHeader = req.headers.cookie || "";
    const cookies: Record<string, string> = Object.fromEntries(
        cookieHeader
            .split(";")
            .map((pair) => pair.trim().split("="))
            .filter(([key, val]) => key && val)
            .map(([key, val]) => [key, decodeURIComponent(val)])
    ); // end of const cookies
    // Return the parsed cookies as a Record<string, string>
    return cookies;
}


import { getAllDocuments, addDoc } from "../controllers/posts.ts";
import { describe, it, jest, expect } from "@jest/globals";
import { Request, Response } from "express";

describe("Posts API Test", () => {
    it("should return posts data with status 200 OK", async () => {
        const req = {} as Request;
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        } as unknown as Response;

        await getAllDocuments(req, res);
        expect(res.status).toHaveBeenCalledWith(200);
    });

    it("should fail with status 400 Bad Request", async () => {
        const req = {
            // No body provided
            body: {}
        } as Request;
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        } as unknown as Response;

        await addDoc(req, res);
        expect(res.status).toHaveBeenCalledWith(400);
    })
})
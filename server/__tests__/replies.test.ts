import { getAllDocuments } from "../controllers/replies.ts";
import { describe, it, jest, expect } from "@jest/globals";
import { Request, Response } from "express";

describe("Replies API Test", () => {
    it("should return replies data with status 200 OK", async () => {
        const req = {} as Request;
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        } as unknown as Response;

        await getAllDocuments(req, res);
        expect(res.status).toHaveBeenCalledWith(200);
    });
})
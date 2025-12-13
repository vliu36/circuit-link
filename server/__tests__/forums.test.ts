import { getAllDocuments, addDoc } from "../controllers/forums.ts";
import { describe, it, jest, expect } from "@jest/globals";
import { Request, Response } from "express";

describe("Forums API Test", () => {
    it("should return forums data with status 200 OK", async () => {
        const req = {} as Request;
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        } as unknown as Response;

        await getAllDocuments(req, res);
        expect(res.status).toHaveBeenCalledWith(200);
    });

    it("should fail with status 500", async () => {
        const req = {
            body: {
                name: "jest-test",
                description: "test-jest",
                isPublic: true,
            }
        } as Request;
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        } as unknown as Response;

        await addDoc(req, res);
        expect(res.status).toHaveBeenCalledWith(500);
    })
})
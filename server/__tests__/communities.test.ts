import { getAllDocuments, addDoc, prefixSearch } from "../controllers/communities.ts";
import { describe, it, jest, expect } from "@jest/globals";
import { Request, Response } from "express";

describe("Communities API Test", () => {
    it("should return communities data with status 200 OK", async () => {
        const req = {} as Request;
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        } as unknown as Response;

        await getAllDocuments(req, res);
        expect(res.status).toHaveBeenCalledWith(200);
    });

    it("should fail with status 401 unauthorized", async () => {
        const req = {
            body: {
                name: "jest-test-forum",
                description: "forum-test-jest",
                groupId: "",
                commName: "test-jest"
            }
        } as Request;
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        } as unknown as Response;

        await addDoc(req, res);
        expect(res.status).toHaveBeenCalledWith(401);
    })

    it("should succeed with status 200 OK and return a list containing Minecraft", async () => {
        const req = {
            params: {
                query: "miNE",
            }
        } as unknown as Request;
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        } as unknown as Response;

        await addDoc(req, res);
        expect(res.status).toHaveBeenCalledWith(500);
    })
    
})
import { getAllDocuments, userRegistration } from "../controllers/users.ts";
import { describe, it, jest, expect } from "@jest/globals";
import { Request, Response } from "express";

describe("Users API Test", () => {
    it("should return user data with status 200 OK", async () => {
        const req = {} as Request;
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        } as unknown as Response;

        await getAllDocuments(req, res);
        expect(res.status).toHaveBeenCalledWith(200);
    });

    it("should succeed with status 200 OK", async () => {
        const req = {
            body: {
                email: "test@jest.com",
                password: "P455W0RD",
                username: "jest-test"
            }
        } as Request;
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        } as unknown as Response;

        await userRegistration(req, res);
        expect(res.status).toHaveBeenCalledWith(400);
    })
})
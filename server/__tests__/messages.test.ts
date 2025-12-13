import { getAllMessages, addMessage } from "../controllers/messages.ts";
import { describe, it, jest, expect } from "@jest/globals";
import { Request, Response } from "express";

describe("Messages API Test", () => {
    it("should return messages data with status 200 OK", async () => {
        const req = {} as Request;
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        } as unknown as Response;

        await getAllMessages(req, res);
        expect(res.status).toHaveBeenCalledWith(200);
    });

    // addMessage: Test with missing fields
    it("should fail with status 400 Bad Request", async () => {
        const req = {
            // Receiver is not given
            body: { 
                author: "YourMom",
                contents: "test-test",
            }
        } as Request;
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        } as unknown as Response;

        await addMessage(req, res);
        expect(res.status).toHaveBeenCalledWith(400);
    })
})
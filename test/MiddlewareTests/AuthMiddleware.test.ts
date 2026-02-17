import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Response, NextFunction } from "express";
import {
	requireAdmin,
	type AuthRequest,
} from "../../src/middleware/auth.middleware.js";

describe("Auth Middleware", () => {
	let mockResponse: Partial<Response>;
	let mockNext: NextFunction;

	beforeEach(() => {
		mockResponse = {
			status: vi.fn().mockReturnThis(),
			json: vi.fn().mockReturnThis(),
		};
		mockNext = vi.fn();
	});

	const makeRequest = (role?: string): AuthRequest =>
		({
			user: role
				? {
						userId: "user-1",
						firstName: "Pat",
						secondName: "Lee",
						email: "pat.lee@example.com",
						role,
					}
				: undefined,
		}) as AuthRequest;

	it("allows admin users", () => {
		const req = makeRequest("admin");

		requireAdmin(req, mockResponse as Response, mockNext);

		expect(mockNext).toHaveBeenCalledTimes(1);
		expect(mockResponse.status).not.toHaveBeenCalled();
	});

	it("rejects non-admin users", () => {
		const req = makeRequest("user");

		requireAdmin(req, mockResponse as Response, mockNext);

		expect(mockResponse.status).toHaveBeenCalledWith(403);
		expect(mockResponse.json).toHaveBeenCalledWith({
			error: "Admin access required",
		});
		expect(mockNext).not.toHaveBeenCalled();
	});
});

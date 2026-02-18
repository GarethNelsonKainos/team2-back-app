import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import {
	authenticateToken,
	type AuthRequest,
} from "../../src/middleware/auth.middleware.js";

vi.mock("jsonwebtoken");

describe("Auth Middleware - authenticateToken", () => {
	let mockRequest: Partial<AuthRequest>;
	let mockResponse: Partial<Response>;
	let mockNext: NextFunction;
	let originalJwtSecret: string | undefined;

	beforeEach(() => {
		mockRequest = {
			headers: {},
		};
		mockResponse = {
			status: vi.fn().mockReturnThis(),
			json: vi.fn().mockReturnThis(),
		};
		mockNext = vi.fn();

		// Save original JWT_SECRET
		originalJwtSecret = process.env.JWT_SECRET;
		process.env.JWT_SECRET = "test-secret-key";
	});

	afterEach(() => {
		vi.clearAllMocks();
		// Restore original JWT_SECRET
		process.env.JWT_SECRET = originalJwtSecret;
	});

	it("should return 401 when no authorization header is provided", () => {
		authenticateToken(
			mockRequest as AuthRequest,
			mockResponse as Response,
			mockNext,
		);

		expect(mockResponse.status).toHaveBeenCalledWith(401);
		expect(mockResponse.json).toHaveBeenCalledWith({
			error: "Access token required",
		});
		expect(mockNext).not.toHaveBeenCalled();
	});

	it("should return 401 when authorization header is empty", () => {
		mockRequest.headers = { authorization: "" };

		authenticateToken(
			mockRequest as AuthRequest,
			mockResponse as Response,
			mockNext,
		);

		expect(mockResponse.status).toHaveBeenCalledWith(401);
		expect(mockResponse.json).toHaveBeenCalledWith({
			error: "Access token required",
		});
		expect(mockNext).not.toHaveBeenCalled();
	});

	it("should return 401 when authorization header does not contain Bearer token", () => {
		mockRequest.headers = { authorization: "Bearer" };

		authenticateToken(
			mockRequest as AuthRequest,
			mockResponse as Response,
			mockNext,
		);

		expect(mockResponse.status).toHaveBeenCalledWith(401);
		expect(mockResponse.json).toHaveBeenCalledWith({
			error: "Access token required",
		});
		expect(mockNext).not.toHaveBeenCalled();
	});

	it("should return 500 when JWT_SECRET is not configured", () => {
		delete process.env.JWT_SECRET;
		mockRequest.headers = { authorization: "Bearer valid-token" };

		authenticateToken(
			mockRequest as AuthRequest,
			mockResponse as Response,
			mockNext,
		);

		expect(mockResponse.status).toHaveBeenCalledWith(500);
		expect(mockResponse.json).toHaveBeenCalledWith({
			error: "Server configuration error",
		});
		expect(mockNext).not.toHaveBeenCalled();
	});

	it("should return 403 when token is invalid", () => {
		mockRequest.headers = { authorization: "Bearer invalid-token" };
		vi.mocked(jwt.verify).mockImplementation(() => {
			throw new Error("Invalid token");
		});

		authenticateToken(
			mockRequest as AuthRequest,
			mockResponse as Response,
			mockNext,
		);

		expect(mockResponse.status).toHaveBeenCalledWith(403);
		expect(mockResponse.json).toHaveBeenCalledWith({
			error: "Invalid or expired token",
		});
		expect(mockNext).not.toHaveBeenCalled();
	});

	it("should return 403 when token is expired", () => {
		mockRequest.headers = { authorization: "Bearer expired-token" };
		vi.mocked(jwt.verify).mockImplementation(() => {
			throw new jwt.TokenExpiredError("Token expired", new Date());
		});

		authenticateToken(
			mockRequest as AuthRequest,
			mockResponse as Response,
			mockNext,
		);

		expect(mockResponse.status).toHaveBeenCalledWith(403);
		expect(mockResponse.json).toHaveBeenCalledWith({
			error: "Invalid or expired token",
		});
		expect(mockNext).not.toHaveBeenCalled();
	});

	it("should call next() and attach user info when token is valid", () => {
		const mockDecodedToken = {
			userId: "user-123",
			firstName: "John",
			secondName: "Doe",
			email: "john.doe@example.com",
			role: "admin",
		};

		mockRequest.headers = { authorization: "Bearer valid-token" };
		vi.mocked(jwt.verify).mockReturnValue(mockDecodedToken as any);

		authenticateToken(
			mockRequest as AuthRequest,
			mockResponse as Response,
			mockNext,
		);

		expect(jwt.verify).toHaveBeenCalledWith("valid-token", "test-secret-key");
		expect(mockRequest.user).toEqual(mockDecodedToken);
		expect(mockNext).toHaveBeenCalledOnce();
		expect(mockResponse.status).not.toHaveBeenCalled();
		expect(mockResponse.json).not.toHaveBeenCalled();
	});

	it("should verify token with correct JWT_SECRET", () => {
		const mockDecodedToken = {
			userId: "user-123",
			firstName: "Jane",
			secondName: "Smith",
			email: "jane.smith@example.com",
			role: "user",
		};

		mockRequest.headers = { authorization: "Bearer another-valid-token" };
		vi.mocked(jwt.verify).mockReturnValue(mockDecodedToken as any);

		authenticateToken(
			mockRequest as AuthRequest,
			mockResponse as Response,
			mockNext,
		);

		expect(jwt.verify).toHaveBeenCalledWith(
			"another-valid-token",
			process.env.JWT_SECRET,
		);
	});

	it("should extract token correctly from Bearer format", () => {
		const mockDecodedToken = {
			userId: "user-456",
			firstName: "Test",
			secondName: "User",
			email: "test@example.com",
			role: "user",
		};

		mockRequest.headers = {
			authorization: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test",
		};
		vi.mocked(jwt.verify).mockReturnValue(mockDecodedToken as any);

		authenticateToken(
			mockRequest as AuthRequest,
			mockResponse as Response,
			mockNext,
		);

		expect(jwt.verify).toHaveBeenCalledWith(
			"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test",
			"test-secret-key",
		);
	});

	it("should handle malformed JWT error", () => {
		mockRequest.headers = { authorization: "Bearer malformed.token" };
		vi.mocked(jwt.verify).mockImplementation(() => {
			throw new jwt.JsonWebTokenError("jwt malformed");
		});

		authenticateToken(
			mockRequest as AuthRequest,
			mockResponse as Response,
			mockNext,
		);

		expect(mockResponse.status).toHaveBeenCalledWith(403);
		expect(mockResponse.json).toHaveBeenCalledWith({
			error: "Invalid or expired token",
		});
	});
});

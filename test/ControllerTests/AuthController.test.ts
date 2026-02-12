import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { Request, Response } from "express";
import { AuthController } from "../../src/controllers/auth.controller.js";
import { AuthService } from "../../src/services/auth.service.js";

// Mock the Service module
vi.mock("../../src/services/auth.service.js");

describe("AuthController", () => {
	let controller: AuthController;
	let mockRequest: Partial<Request>;
	let mockResponse: Partial<Response>;
	let mockLogin: any;
	let consoleErrorSpy: any;

	const mockTokenResponse = {
		token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.mocktoken",
	};

	beforeEach(() => {
		// Create mock request and response
		mockRequest = {
			body: {},
		};
		mockResponse = {
			status: vi.fn().mockReturnThis(),
			json: vi.fn().mockReturnThis(),
		};

		// Create mock function for Service method
		mockLogin = vi.fn().mockResolvedValue(mockTokenResponse);

		// Mock the Service class
		AuthService.prototype.login = mockLogin;

		// Spy on console.error to suppress error logs in tests
		consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

		controller = new AuthController();
	});

	afterEach(() => {
		consoleErrorSpy.mockRestore();
	});

	describe("login", () => {
		it("should return 200 status with token when credentials are valid", async () => {
			// Arrange
			mockRequest.body = {
				email: "admin@test.com",
				password: "password123",
			};

			// Act
			await controller.login(mockRequest as Request, mockResponse as Response);

			// Assert
			expect(mockResponse.status).toHaveBeenCalledWith(200);
			expect(mockResponse.json).toHaveBeenCalledWith(mockTokenResponse);
		});

		it("should call service login method with correct parameters", async () => {
			// Arrange
			mockRequest.body = {
				email: "user@test.com",
				password: "password123",
			};

			// Act
			await controller.login(mockRequest as Request, mockResponse as Response);

			// Assert
			expect(mockLogin).toHaveBeenCalledTimes(1);
			expect(mockLogin).toHaveBeenCalledWith("user@test.com", "password123");
		});

		it("should return 400 status when email is missing", async () => {
			// Arrange
			mockRequest.body = {
				password: "password123",
			};

			// Act
			await controller.login(mockRequest as Request, mockResponse as Response);

			// Assert
			expect(mockResponse.status).toHaveBeenCalledWith(400);
			expect(mockResponse.json).toHaveBeenCalledWith({
				error: "Email and password are required",
			});
			expect(mockLogin).not.toHaveBeenCalled();
		});

		it("should return 400 status when password is missing", async () => {
			// Arrange
			mockRequest.body = {
				email: "admin@test.com",
			};

			// Act
			await controller.login(mockRequest as Request, mockResponse as Response);

			// Assert
			expect(mockResponse.status).toHaveBeenCalledWith(400);
			expect(mockResponse.json).toHaveBeenCalledWith({
				error: "Email and password are required",
			});
			expect(mockLogin).not.toHaveBeenCalled();
		});

		it("should return 400 status when both email and password are missing", async () => {
			// Arrange
			mockRequest.body = {};

			// Act
			await controller.login(mockRequest as Request, mockResponse as Response);

			// Assert
			expect(mockResponse.status).toHaveBeenCalledWith(400);
			expect(mockResponse.json).toHaveBeenCalledWith({
				error: "Email and password are required",
			});
			expect(mockLogin).not.toHaveBeenCalled();
		});

		it("should return 400 status when email is empty string", async () => {
			// Arrange
			mockRequest.body = {
				email: "",
				password: "password123",
			};

			// Act
			await controller.login(mockRequest as Request, mockResponse as Response);

			// Assert
			expect(mockResponse.status).toHaveBeenCalledWith(400);
			expect(mockResponse.json).toHaveBeenCalledWith({
				error: "Email and password are required",
			});
		});

		it("should return 400 status when password is empty string", async () => {
			// Arrange
			mockRequest.body = {
				email: "admin@test.com",
				password: "",
			};

			// Act
			await controller.login(mockRequest as Request, mockResponse as Response);

			// Assert
			expect(mockResponse.status).toHaveBeenCalledWith(400);
			expect(mockResponse.json).toHaveBeenCalledWith({
				error: "Email and password are required",
			});
		});

		it("should return 401 status when service throws error for invalid credentials", async () => {
			// Arrange
			mockRequest.body = {
				email: "admin@test.com",
				password: "wrongpassword",
			};
			const error = new Error("Invalid credentials");
			mockLogin.mockRejectedValue(error);

			// Act
			await controller.login(mockRequest as Request, mockResponse as Response);

			// Assert
			expect(mockResponse.status).toHaveBeenCalledWith(401);
			expect(mockResponse.json).toHaveBeenCalledWith({
				error: "Invalid credentials",
			});
		});

		it("should return 401 status when service throws any error", async () => {
			// Arrange
			mockRequest.body = {
				email: "admin@test.com",
				password: "password123",
			};
			const error = new Error("Database connection failed");
			mockLogin.mockRejectedValue(error);

			// Act
			await controller.login(mockRequest as Request, mockResponse as Response);

			// Assert
			expect(mockResponse.status).toHaveBeenCalledWith(500);
			expect(mockResponse.json).toHaveBeenCalledWith({
				error: "Internal server error",
			});
		});

		it("should log error when service throws an error", async () => {
			// Arrange
			mockRequest.body = {
				email: "admin@test.com",
				password: "password123",
			};
			const error = new Error("Service error");
			mockLogin.mockRejectedValue(error);

			// Act
			await controller.login(mockRequest as Request, mockResponse as Response);

			// Assert
			expect(consoleErrorSpy).toHaveBeenCalledWith("Login error:", error);
		});
	});
});

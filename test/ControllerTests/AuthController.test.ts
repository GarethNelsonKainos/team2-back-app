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
	let mockRegister: any;
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
		mockRegister = vi.fn().mockResolvedValue(mockTokenResponse);
		// Mock the Service class
		AuthService.prototype.login = mockLogin;
		AuthService.prototype.register = mockRegister;

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

	describe("register", () => {
		it("should return 201 status with token when registration is successful", async () => {
			// Arrange
			mockRequest.body = {
				email: "newuser@test.com",
				firstName: "New",
				secondName: "User",
				password: "SecurePass123!",
				confirmedPassword: "SecurePass123!",
			};

			// Act
			await controller.register(
				mockRequest as Request,
				mockResponse as Response,
			);

			// Assert
			expect(mockResponse.status).toHaveBeenCalledWith(201);
			expect(mockResponse.json).toHaveBeenCalledWith(mockTokenResponse);
		});

		it("should call service register method with correct parameters", async () => {
			// Arrange
			mockRequest.body = {
				email: "test@test.com",
				firstName: "Test",
				secondName: "User",
				password: "SecurePass123!",
				confirmedPassword: "SecurePass123!",
			};

			// Act
			await controller.register(
				mockRequest as Request,
				mockResponse as Response,
			);

			// Assert
			expect(mockRegister).toHaveBeenCalledTimes(1);
			expect(mockRegister).toHaveBeenCalledWith({
				email: "test@test.com",
				firstName: "Test",
				secondName: "User",
				password: "SecurePass123!",
				confirmedPassword: "SecurePass123!",
			});
		});

		it("should return 400 status when email is missing", async () => {
			// Arrange
			mockRequest.body = {
				firstName: "Test",
				secondName: "User",
				password: "SecurePass123!",
				confirmedPassword: "SecurePass123!",
			};

			// Act
			await controller.register(
				mockRequest as Request,
				mockResponse as Response,
			);

			// Assert
			expect(mockResponse.status).toHaveBeenCalledWith(400);
			expect(mockResponse.json).toHaveBeenCalledWith({
				error:
					"All fields are required: email, firstName, secondName, password, confirmedPassword",
			});
			expect(mockRegister).not.toHaveBeenCalled();
		});

		it("should return 400 status when firstName is missing", async () => {
			// Arrange
			mockRequest.body = {
				email: "test@test.com",
				secondName: "User",
				password: "SecurePass123!",
				confirmedPassword: "SecurePass123!",
			};

			// Act
			await controller.register(
				mockRequest as Request,
				mockResponse as Response,
			);

			// Assert
			expect(mockResponse.status).toHaveBeenCalledWith(400);
			expect(mockResponse.json).toHaveBeenCalledWith({
				error:
					"All fields are required: email, firstName, secondName, password, confirmedPassword",
			});
			expect(mockRegister).not.toHaveBeenCalled();
		});

		it("should return 400 status when secondName is missing", async () => {
			// Arrange
			mockRequest.body = {
				email: "test@test.com",
				firstName: "Test",
				password: "SecurePass123!",
				confirmedPassword: "SecurePass123!",
			};

			// Act
			await controller.register(
				mockRequest as Request,
				mockResponse as Response,
			);

			// Assert
			expect(mockResponse.status).toHaveBeenCalledWith(400);
			expect(mockResponse.json).toHaveBeenCalledWith({
				error:
					"All fields are required: email, firstName, secondName, password, confirmedPassword",
			});
			expect(mockRegister).not.toHaveBeenCalled();
		});

		it("should return 400 status when password is missing", async () => {
			// Arrange
			mockRequest.body = {
				email: "test@test.com",
				firstName: "Test",
				secondName: "User",
				confirmedPassword: "SecurePass123!",
			};

			// Act
			await controller.register(
				mockRequest as Request,
				mockResponse as Response,
			);

			// Assert
			expect(mockResponse.status).toHaveBeenCalledWith(400);
			expect(mockResponse.json).toHaveBeenCalledWith({
				error:
					"All fields are required: email, firstName, secondName, password, confirmedPassword",
			});
			expect(mockRegister).not.toHaveBeenCalled();
		});

		it("should return 400 status when confirmedPassword is missing", async () => {
			// Arrange
			mockRequest.body = {
				email: "test@test.com",
				firstName: "Test",
				secondName: "User",
				password: "SecurePass123!",
			};

			// Act
			await controller.register(
				mockRequest as Request,
				mockResponse as Response,
			);

			// Assert
			expect(mockResponse.status).toHaveBeenCalledWith(400);
			expect(mockResponse.json).toHaveBeenCalledWith({
				error:
					"All fields are required: email, firstName, secondName, password, confirmedPassword",
			});
			expect(mockRegister).not.toHaveBeenCalled();
		});

		it("should return 400 status when email format is invalid", async () => {
			// Arrange
			mockRequest.body = {
				email: "notanemail",
				firstName: "Test",
				secondName: "User",
				password: "SecurePass123!",
				confirmedPassword: "SecurePass123!",
			};

			// Act
			await controller.register(
				mockRequest as Request,
				mockResponse as Response,
			);

			// Assert
			expect(mockResponse.status).toHaveBeenCalledWith(400);
			expect(mockResponse.json).toHaveBeenCalledWith({
				error: "Invalid email format",
			});
			expect(mockRegister).not.toHaveBeenCalled();
		});

		it("should return 409 status when user already exists", async () => {
			// Arrange
			mockRequest.body = {
				email: "existing@test.com",
				firstName: "Existing",
				secondName: "User",
				password: "SecurePass123!",
				confirmedPassword: "SecurePass123!",
			};
			mockRegister.mockRejectedValue(
				new Error("User with this email already exists"),
			);

			// Act
			await controller.register(
				mockRequest as Request,
				mockResponse as Response,
			);

			// Assert
			expect(mockResponse.status).toHaveBeenCalledWith(409);
			expect(mockResponse.json).toHaveBeenCalledWith({
				error: "User with this email already exists",
			});
		});

		it("should return 400 status when passwords do not match", async () => {
			// Arrange
			mockRequest.body = {
				email: "test@test.com",
				firstName: "Test",
				secondName: "User",
				password: "SecurePass123!",
				confirmedPassword: "SecurePass123!",
			};
			mockRegister.mockRejectedValue(new Error("Passwords do not match"));

			// Act
			await controller.register(
				mockRequest as Request,
				mockResponse as Response,
			);

			// Assert
			expect(mockResponse.status).toHaveBeenCalledWith(400);
			expect(mockResponse.json).toHaveBeenCalledWith({
				error: "Passwords do not match",
			});
		});

		it("should return 400 status for password validation errors", async () => {
			// Arrange
			mockRequest.body = {
				email: "test@test.com",
				firstName: "Test",
				secondName: "User",
				password: "weak",
				confirmedPassword: "weak",
			};
			mockRegister.mockRejectedValue(
				new Error(
					"Password must be more than 8 characters and contain uppercase, lowercase, and special characters",
				),
			);

			// Act
			await controller.register(
				mockRequest as Request,
				mockResponse as Response,
			);

			// Assert
			expect(mockResponse.status).toHaveBeenCalledWith(400);
			expect(mockResponse.json).toHaveBeenCalledWith({
				error:
					"Password must be more than 8 characters and contain uppercase, lowercase, and special characters",
			});
		});

		it("should return 500 status for unexpected errors", async () => {
			// Arrange
			mockRequest.body = {
				email: "test@test.com",
				firstName: "Test",
				secondName: "User",
				password: "SecurePass123!",
				confirmedPassword: "SecurePass123!",
			};
			mockRegister.mockRejectedValue(new Error("Unexpected database error"));

			// Act
			await controller.register(
				mockRequest as Request,
				mockResponse as Response,
			);

			// Assert
			expect(mockResponse.status).toHaveBeenCalledWith(500);
			expect(mockResponse.json).toHaveBeenCalledWith({
				error: "Internal server error",
			});
		});

		it("should log errors to console", async () => {
			// Arrange
			mockRequest.body = {
				email: "test@test.com",
				firstName: "Test",
				secondName: "User",
				password: "SecurePass123!",
				confirmedPassword: "SecurePass123!",
			};
			const testError = new Error("Test error");
			mockRegister.mockRejectedValue(testError);

			// Act
			await controller.register(
				mockRequest as Request,
				mockResponse as Response,
			);

			// Assert
			expect(consoleErrorSpy).toHaveBeenCalledWith(
				"Registration error:",
				testError,
			);
		});

		it("should return 500 status for non-Error objects", async () => {
			// Arrange
			mockRequest.body = {
				email: "test@test.com",
				firstName: "Test",
				secondName: "User",
				password: "SecurePass123!",
				confirmedPassword: "SecurePass123!",
			};
			mockRegister.mockRejectedValue("Unknown error string");

			// Act
			await controller.register(
				mockRequest as Request,
				mockResponse as Response,
			);

			// Assert
			expect(mockResponse.status).toHaveBeenCalledWith(500);
			expect(mockResponse.json).toHaveBeenCalledWith({
				error: "Internal server error",
			});
		});
	});
});

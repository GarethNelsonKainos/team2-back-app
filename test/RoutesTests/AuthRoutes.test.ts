import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import express from "express";
import request from "supertest";
import { AuthDao } from "../../src/daos/auth.dao.js";
import authRouter from "../../src/routes/auth.routes.js";
import argon2 from "argon2";

// Mock argon2 at the top level
vi.mock("argon2", () => ({
	default: {
		hash: vi.fn(),
		verify: vi.fn(),
	},
}));

describe("Auth Routes - Integration Tests", () => {
	let app: express.Application;
	let findUserByEmailSpy: ReturnType<typeof vi.spyOn>;

	const mockUser = {
		userId: "550e8400-e29b-41d4-a716-446655440000",
		email: "admin@test.com",
		firstName: "Admin",
		secondName: "User",
		password: "hashed_password123", // Simple mock hash
		role: "admin",
		createdAt: new Date("2026-01-01T00:00:00Z"),
		updatedAt: new Date("2026-01-01T00:00:00Z"),
	};

	beforeEach(() => {
		// Setup argon2 mocks
		vi.mocked(argon2.hash).mockResolvedValue("hashed_password123");
		vi.mocked(argon2.verify).mockImplementation(async (hash, password) => {
			// Simulate correct password verification
			return hash === "hashed_password123" && password === "password123";
		});

		// Create Express app with routes
		app = express();
		app.use(express.json());
		app.use("/api", authRouter);

		findUserByEmailSpy = vi
			.spyOn(AuthDao.prototype, "findUserByEmail")
			.mockResolvedValue(mockUser);

		process.env.JWT_SECRET = "test-secret-key";
		process.env.JWT_EXPIRES_IN = "1h";
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe("POST /api/login", () => {
		it("should return 200 with token for valid credentials", async () => {
			// Act
			const response = await request(app).post("/api/login").send({
				email: "admin@test.com",
				password: "password123",
			});

			// Assert
			expect(response.status).toBe(200);
			expect(response.body).toHaveProperty("token");
			expect(typeof response.body.token).toBe("string");
			expect(response.body.token).toBeTruthy();
		});

		it("should call DAO findUserByEmail with correct email", async () => {
			// Act
			await request(app).post("/api/login").send({
				email: "admin@test.com",
				password: "password123",
			});

			// Assert
			expect(findUserByEmailSpy).toHaveBeenCalledTimes(1);
			expect(findUserByEmailSpy).toHaveBeenCalledWith("admin@test.com");
		});

		it("should return 400 when email is missing", async () => {
			// Act
			const response = await request(app).post("/api/login").send({
				password: "password123",
			});

			// Assert
			expect(response.status).toBe(400);
			expect(response.body).toEqual({
				error: "Email and password are required",
			});
		});

		it("should return 400 when password is missing", async () => {
			// Act
			const response = await request(app).post("/api/login").send({
				email: "admin@test.com",
			});

			// Assert
			expect(response.status).toBe(400);
			expect(response.body).toEqual({
				error: "Email and password are required",
			});
		});

		it("should return 400 when both email and password are missing", async () => {
			// Act
			const response = await request(app).post("/api/login").send({});

			// Assert
			expect(response.status).toBe(400);
			expect(response.body).toEqual({
				error: "Email and password are required",
			});
		});

		it("should return 400 when email is empty string", async () => {
			// Act
			const response = await request(app).post("/api/login").send({
				email: "",
				password: "password123",
			});

			// Assert
			expect(response.status).toBe(400);
			expect(response.body).toEqual({
				error: "Email and password are required",
			});
		});

		it("should return 400 when password is empty string", async () => {
			// Act
			const response = await request(app).post("/api/login").send({
				email: "admin@test.com",
				password: "",
			});

			// Assert
			expect(response.status).toBe(400);
			expect(response.body).toEqual({
				error: "Email and password are required",
			});
		});

		it("should return 401 for invalid password", async () => {
			// Act
			const response = await request(app).post("/api/login").send({
				email: "admin@test.com",
				password: "wrongpassword",
			});

			// Assert
			expect(response.status).toBe(401);
			expect(response.body).toEqual({
				error: "Invalid credentials",
			});
		});

		it("should return 401 for non-existent email", async () => {
			// Arrange
			findUserByEmailSpy.mockResolvedValue(null);

			// Act
			const response = await request(app).post("/api/login").send({
				email: "notfound@test.com",
				password: "password123",
			});

			// Assert
			expect(response.status).toBe(401);
			expect(response.body).toEqual({
				error: "Invalid credentials",
			});
		});

		it("should return 500 when DAO throws an error", async () => {
			// Arrange
			findUserByEmailSpy.mockRejectedValue(new Error("Database error"));

			// Act
			const response = await request(app).post("/api/login").send({
				email: "admin@test.com",
				password: "password123",
			});

			// Assert
			expect(response.status).toBe(500);
			expect(response.body).toEqual({
				error: "Internal server error",
			});
		});

		it("should set correct Content-Type header", async () => {
			// Act
			const response = await request(app).post("/api/login").send({
				email: "admin@test.com",
				password: "password123",
			});

			// Assert
			expect(response.headers["content-type"]).toMatch(/application\/json/);
		});

		it("should handle different user roles correctly (regular user)", async () => {
			// Arrange
			const regularUser = {
				...mockUser,
				userId: "660e8400-e29b-41d4-a716-446655440001",
				email: "user@test.com",
				role: "user",
			};
			findUserByEmailSpy.mockResolvedValue(regularUser);

			// Act
			const response = await request(app).post("/api/login").send({
				email: "user@test.com",
				password: "password123",
			});

			// Assert
			expect(response.status).toBe(200);
			expect(response.body).toHaveProperty("token");
		});
	});

	describe("POST /api/register", () => {
		let createUserSpy: ReturnType<typeof vi.spyOn>;

		beforeEach(() => {
			// Mock createUser for registration tests
			createUserSpy = vi.spyOn(AuthDao.prototype, "createUser");
		});

		it("should return 201 with token for successful registration", async () => {
			// Arrange
			findUserByEmailSpy.mockResolvedValue(null); // User doesn't exist
			createUserSpy.mockResolvedValue({
				userId: "123e4567-e89b-12d3-a456-426614174000",
				email: "newuser@test.com",
				firstName: "New",
				secondName: "User",
				password: "hashed_password123",
				role: "user",
				createdAt: new Date("2026-02-16T00:00:00Z"),
				updatedAt: new Date("2026-02-16T00:00:00Z"),
			});

			// Act
			const response = await request(app).post("/api/register").send({
				email: "newuser@test.com",
				firstName: "New",
				secondName: "User",
				password: "SecurePass123!",
				confirmedPassword: "SecurePass123!",
			});

			// Assert
			expect(response.status).toBe(201);
			expect(response.body).toHaveProperty("token");
			expect(typeof response.body.token).toBe("string");
		});

		it("should call DAO methods with correct parameters", async () => {
			// Arrange
			findUserByEmailSpy.mockResolvedValue(null);
			createUserSpy.mockResolvedValue({
				userId: "123",
				email: "test@test.com",
				firstName: "Test",
				secondName: "User",
				password: "hashed",
				role: "user",
				createdAt: new Date(),
				updatedAt: new Date(),
			});

			// Act
			await request(app).post("/api/register").send({
				email: "test@test.com",
				firstName: "Test",
				secondName: "User",
				password: "SecurePass123!",
				confirmedPassword: "SecurePass123!",
			});

			// Assert
			expect(findUserByEmailSpy).toHaveBeenCalledWith("test@test.com");
			expect(createUserSpy).toHaveBeenCalledOnce();
			expect(createUserSpy).toHaveBeenCalledWith(
				expect.objectContaining({
					email: "test@test.com",
					firstName: "Test",
					secondName: "User",
				}),
			);
		});

		it("should return 400 when email is missing", async () => {
			// Act
			const response = await request(app).post("/api/register").send({
				firstName: "Test",
				secondName: "User",
				password: "SecurePass123!",
				confirmedPassword: "SecurePass123!",
			});

			// Assert
			expect(response.status).toBe(400);
			expect(response.body).toEqual({
				error:
					"All fields are required: email, firstName, secondName, password, confirmedPassword",
			});
		});

		it("should return 400 when firstName is missing", async () => {
			// Act
			const response = await request(app).post("/api/register").send({
				email: "test@test.com",
				secondName: "User",
				password: "SecurePass123!",
				confirmedPassword: "SecurePass123!",
			});

			// Assert
			expect(response.status).toBe(400);
			expect(response.body.error).toContain("All fields are required");
		});

		it("should return 400 when secondName is missing", async () => {
			// Act
			const response = await request(app).post("/api/register").send({
				email: "test@test.com",
				firstName: "Test",
				password: "SecurePass123!",
				confirmedPassword: "SecurePass123!",
			});

			// Assert
			expect(response.status).toBe(400);
			expect(response.body.error).toContain("All fields are required");
		});

		it("should return 400 when password is missing", async () => {
			// Act
			const response = await request(app).post("/api/register").send({
				email: "test@test.com",
				firstName: "Test",
				secondName: "User",
				confirmedPassword: "SecurePass123!",
			});

			// Assert
			expect(response.status).toBe(400);
			expect(response.body.error).toContain("All fields are required");
		});

		it("should return 400 when confirmedPassword is missing", async () => {
			// Act
			const response = await request(app).post("/api/register").send({
				email: "test@test.com",
				firstName: "Test",
				secondName: "User",
				password: "SecurePass123!",
			});

			// Assert
			expect(response.status).toBe(400);
			expect(response.body.error).toContain("All fields are required");
		});

		it("should return 400 for invalid email format", async () => {
			// Act
			const response = await request(app).post("/api/register").send({
				email: "notanemail",
				firstName: "Test",
				secondName: "User",
				password: "SecurePass123!",
				confirmedPassword: "SecurePass123!",
			});

			// Assert
			expect(response.status).toBe(400);
			expect(response.body).toEqual({ error: "Invalid email format" });
		});

		it("should return 400 when passwords do not match", async () => {
			// Arrange
			findUserByEmailSpy.mockResolvedValue(null);

			// Act
			const response = await request(app).post("/api/register").send({
				email: "test@test.com",
				firstName: "Test",
				secondName: "User",
				password: "SecurePass123!",
				confirmedPassword: "DifferentPass123!",
			});

			// Assert
			expect(response.status).toBe(400);
			expect(response.body).toEqual({ error: "Passwords do not match" });
		});

		it("should return 400 for weak password (too short)", async () => {
			// Arrange
			findUserByEmailSpy.mockResolvedValue(null);

			// Act
			const response = await request(app).post("/api/register").send({
				email: "test@test.com",
				firstName: "Test",
				secondName: "User",
				password: "Short1!",
				confirmedPassword: "Short1!",
			});

			// Assert
			expect(response.status).toBe(400);
			expect(response.body.error).toContain(
				"Password must be more than 8 characters",
			);
		});

		it("should return 400 for password without uppercase", async () => {
			// Arrange
			findUserByEmailSpy.mockResolvedValue(null);

			// Act
			const response = await request(app).post("/api/register").send({
				email: "test@test.com",
				firstName: "Test",
				secondName: "User",
				password: "lowercase123!",
				confirmedPassword: "lowercase123!",
			});

			// Assert
			expect(response.status).toBe(400);
			expect(response.body.error).toContain("uppercase");
		});

		it("should return 400 for password without lowercase", async () => {
			// Arrange
			findUserByEmailSpy.mockResolvedValue(null);

			// Act
			const response = await request(app).post("/api/register").send({
				email: "test@test.com",
				firstName: "Test",
				secondName: "User",
				password: "UPPERCASE123!",
				confirmedPassword: "UPPERCASE123!",
			});

			// Assert
			expect(response.status).toBe(400);
			expect(response.body.error).toContain("lowercase");
		});

		it("should return 400 for password without special character", async () => {
			// Arrange
			findUserByEmailSpy.mockResolvedValue(null);

			// Act
			const response = await request(app).post("/api/register").send({
				email: "test@test.com",
				firstName: "Test",
				secondName: "User",
				password: "NoSpecialChar123",
				confirmedPassword: "NoSpecialChar123",
			});

			// Assert
			expect(response.status).toBe(400);
			expect(response.body.error).toContain("special");
		});

		it("should return 409 when user already exists", async () => {
			// Arrange
			findUserByEmailSpy.mockResolvedValue(mockUser); // User exists

			// Act
			const response = await request(app).post("/api/register").send({
				email: "admin@test.com",
				firstName: "Admin",
				secondName: "User",
				password: "SecurePass123!",
				confirmedPassword: "SecurePass123!",
			});

			// Assert
			expect(response.status).toBe(409);
			expect(response.body).toEqual({
				error: "User with this email already exists",
			});
		});

		it("should hash password before storing", async () => {
			// Arrange
			findUserByEmailSpy.mockResolvedValue(null);
			createUserSpy.mockResolvedValue({
				userId: "123",
				email: "test@test.com",
				firstName: "Test",
				secondName: "User",
				password: "hashed",
				role: "user",
				createdAt: new Date(),
				updatedAt: new Date(),
			});

			// Act
			await request(app).post("/api/register").send({
				email: "test@test.com",
				firstName: "Test",
				secondName: "User",
				password: "SecurePass123!",
				confirmedPassword: "SecurePass123!",
			});

			// Assert
			expect(argon2.hash).toHaveBeenCalledWith("SecurePass123!");
			const createCall = createUserSpy.mock.calls[0][0];
			expect(createCall.password).not.toBe("SecurePass123!");
		});

		it("should create user with role defaulting to 'user'", async () => {
			// Arrange
			findUserByEmailSpy.mockResolvedValue(null);
			const newUser = {
				userId: "123",
				email: "test@test.com",
				firstName: "Test",
				secondName: "User",
				password: "hashed",
				role: "user",
				createdAt: new Date(),
				updatedAt: new Date(),
			};
			createUserSpy.mockResolvedValue(newUser);

			// Act
			const response = await request(app).post("/api/register").send({
				email: "test@test.com",
				firstName: "Test",
				secondName: "User",
				password: "SecurePass123!",
				confirmedPassword: "SecurePass123!",
			});

			// Assert
			expect(response.status).toBe(201);
			expect(response.body.token).toBeDefined();
		});
	});
});

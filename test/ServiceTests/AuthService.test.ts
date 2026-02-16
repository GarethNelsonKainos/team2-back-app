import { describe, it, expect, vi, beforeEach } from "vitest";
import { AuthService } from "../../src/services/auth.service.js";
import { AuthDao } from "../../src/daos/auth.dao.js";
import type { User } from "../../src/generated/prisma/client.js";

// Mock the DAO module
vi.mock("../../src/daos/auth.dao.js");

describe("AuthService", () => {
	let authService: AuthService;
	let mockFindUserByEmail: any;

	// Ensure JWT_SECRET is set for tests
	process.env.JWT_SECRET = "test-secret-key-for-testing-only";
	process.env.JWT_EXPIRES_IN = "1h";

	const mockUser: User = {
		userId: "550e8400-e29b-41d4-a716-446655440000",
		email: "admin@test.com",
		firstName: "Admin",
		secondName: "User",
		// This is the hash for "password123" using argon2
		password: "$argon2id$v=19$m=65536,t=3,p=4$c29tZXNhbHQ$YourHashHere",
		role: "admin",
		createdAt: new Date("2026-01-01T00:00:00Z"),
		updatedAt: new Date("2026-01-01T00:00:00Z"),
	};

	beforeEach(() => {
		mockFindUserByEmail = vi.fn();
		AuthDao.prototype.findUserByEmail = mockFindUserByEmail;
		authService = new AuthService();
	});

	it("should return token for valid credentials", async () => {
		// Hash for "password123"
		const hashedPassword = await import("argon2").then((argon2) =>
			argon2.hash("password123"),
		);
		mockFindUserByEmail.mockResolvedValue({
			...mockUser,
			password: hashedPassword,
		});

		const result = await authService.login("admin@test.com", "password123");
		expect(result.token).toBeDefined();
		expect(typeof result.token).toBe("string");
		expect(mockFindUserByEmail).toHaveBeenCalledWith("admin@test.com");
	});

	it("should throw error for invalid password", async () => {
		const hashedPassword = await import("argon2").then((argon2) =>
			argon2.hash("password123"),
		);
		mockFindUserByEmail.mockResolvedValue({
			...mockUser,
			password: hashedPassword,
		});

		await expect(
			authService.login("admin@test.com", "wrongpassword"),
		).rejects.toThrow("Invalid credentials");
		expect(mockFindUserByEmail).toHaveBeenCalledWith("admin@test.com");
	});

	it("should throw error for non-existent email", async () => {
		mockFindUserByEmail.mockResolvedValue(null);

		await expect(
			authService.login("fake@test.com", "password123"),
		).rejects.toThrow("Invalid credentials");
		expect(mockFindUserByEmail).toHaveBeenCalledWith("fake@test.com");
	});

	it("should throw error if JWT_SECRET is missing", async () => {
		const hashedPassword = await import("argon2").then((argon2) =>
			argon2.hash("password123"),
		);
		mockFindUserByEmail.mockResolvedValue({
			...mockUser,
			password: hashedPassword,
		});

		const originalSecret = process.env.JWT_SECRET;
		delete process.env.JWT_SECRET;

		await expect(
			authService.login("admin@test.com", "password123"),
		).rejects.toThrow("JWT_SECRET environment variable is not defined");

		process.env.JWT_SECRET = originalSecret;
	});

	describe("register", () => {
		let mockCreateUser: any;

		beforeEach(() => {
			mockCreateUser = vi.fn();
			mockFindUserByEmail = vi.fn();
			AuthDao.prototype.findUserByEmail = mockFindUserByEmail;
			AuthDao.prototype.createUser = mockCreateUser;
			authService = new AuthService();
		});

		it("should successfully register a new user and return token", async () => {
			// Arrange
			const userData = {
				email: "newuser@test.com",
				firstName: "New",
				secondName: "User",
				password: "SecurePass123!",
				confirmedPassword: "SecurePass123!",
			};
			mockFindUserByEmail.mockResolvedValue(null); // User doesn't exist
			mockCreateUser.mockResolvedValue({
				userId: "123e4567-e89b-12d3-a456-426614174000",
				email: userData.email,
				firstName: userData.firstName,
				secondName: userData.secondName,
				password: "hashed_password",
				role: "user",
				createdAt: new Date(),
				updatedAt: new Date(),
			});

			// Act
			const result = await authService.register(userData);

			// Assert
			expect(result.token).toBeDefined();
			expect(typeof result.token).toBe("string");
			expect(mockFindUserByEmail).toHaveBeenCalledWith(userData.email);
			expect(mockCreateUser).toHaveBeenCalledOnce();
		});

		it("should throw error when passwords do not match", async () => {
			// Arrange
			const userData = {
				email: "test@test.com",
				firstName: "Test",
				secondName: "User",
				password: "SecurePass123!",
				confirmedPassword: "DifferentPass123!",
			};

			// Act & Assert
			await expect(authService.register(userData)).rejects.toThrow(
				"Passwords do not match",
			);
			expect(mockFindUserByEmail).not.toHaveBeenCalled();
			expect(mockCreateUser).not.toHaveBeenCalled();
		});

		it("should throw error when password is too short", async () => {
			// Arrange
			const userData = {
				email: "test@test.com",
				firstName: "Test",
				secondName: "User",
				password: "Short1!",
				confirmedPassword: "Short1!",
			};

			// Act & Assert
			await expect(authService.register(userData)).rejects.toThrow(
				"Password must be more than 8 characters",
			);
			expect(mockCreateUser).not.toHaveBeenCalled();
		});

		it("should throw error when password lacks uppercase letter", async () => {
			// Arrange
			const userData = {
				email: "test@test.com",
				firstName: "Test",
				secondName: "User",
				password: "lowercase123!",
				confirmedPassword: "lowercase123!",
			};

			// Act & Assert
			await expect(authService.register(userData)).rejects.toThrow(
				"Password must contain uppercase letters",
			);
			expect(mockCreateUser).not.toHaveBeenCalled();
		});

		it("should throw error when password lacks lowercase letter", async () => {
			// Arrange
			const userData = {
				email: "test@test.com",
				firstName: "Test",
				secondName: "User",
				password: "UPPERCASE123!",
				confirmedPassword: "UPPERCASE123!",
			};

			// Act & Assert
			await expect(authService.register(userData)).rejects.toThrow(
				"Password must contain lowercase letters",
			);
			expect(mockCreateUser).not.toHaveBeenCalled();
		});

		it("should throw error when password lacks special character", async () => {
			// Arrange
			const userData = {
				email: "test@test.com",
				firstName: "Test",
				secondName: "User",
				password: "NoSpecialChar123",
				confirmedPassword: "NoSpecialChar123",
			};

			// Act & Assert
			await expect(authService.register(userData)).rejects.toThrow(
				"Password must contain special characters",
			);
			expect(mockCreateUser).not.toHaveBeenCalled();
		});

		it("should throw error when user already exists", async () => {
			// Arrange
			const userData = {
				email: "existing@test.com",
				firstName: "Existing",
				secondName: "User",
				password: "SecurePass123!",
				confirmedPassword: "SecurePass123!",
			};
			mockFindUserByEmail.mockResolvedValue(mockUser); // User exists

			// Act & Assert
			await expect(authService.register(userData)).rejects.toThrow(
				"User with this email already exists",
			);
			expect(mockFindUserByEmail).toHaveBeenCalledWith(userData.email);
			expect(mockCreateUser).not.toHaveBeenCalled();
		});

		it("should hash password before creating user", async () => {
			// Arrange
			const userData = {
				email: "test@test.com",
				firstName: "Test",
				secondName: "User",
				password: "SecurePass123!",
				confirmedPassword: "SecurePass123!",
			};
			mockFindUserByEmail.mockResolvedValue(null);
			mockCreateUser.mockResolvedValue({
				userId: "123",
				...userData,
				password: "hashed",
				role: "user",
				createdAt: new Date(),
				updatedAt: new Date(),
			});

			// Act
			await authService.register(userData);

			// Assert
			const createCall = mockCreateUser.mock.calls[0][0];
			expect(createCall.password).not.toBe(userData.password);
			expect(createCall.password).toMatch(/^\$argon2/); // Argon2 hash format
		});

		it("should create user with role defaulting to 'user'", async () => {
			// Arrange
			const userData = {
				email: "test@test.com",
				firstName: "Test",
				secondName: "User",
				password: "SecurePass123!",
				confirmedPassword: "SecurePass123!",
			};
			mockFindUserByEmail.mockResolvedValue(null);
			const mockNewUser = {
				userId: "123",
				email: userData.email,
				firstName: userData.firstName,
				secondName: userData.secondName,
				password: "hashed",
				role: "user",
				createdAt: new Date(),
				updatedAt: new Date(),
			};
			mockCreateUser.mockResolvedValue(mockNewUser);

			// Act
			await authService.register(userData);

			// Assert
			expect(mockCreateUser).toHaveBeenCalledWith(
				expect.objectContaining({
					email: userData.email,
					firstName: userData.firstName,
					secondName: userData.secondName,
				}),
			);
		});
	});
});

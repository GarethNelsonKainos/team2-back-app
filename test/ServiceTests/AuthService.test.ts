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
		const hashedPassword = await import("argon2").then(argon2 => argon2.hash("password123"));
		mockFindUserByEmail.mockResolvedValue({ ...mockUser, password: hashedPassword });

		const result = await authService.login("admin@test.com", "password123");
		expect(result.token).toBeDefined();
		expect(typeof result.token).toBe("string");
		expect(mockFindUserByEmail).toHaveBeenCalledWith("admin@test.com");
	});

	it("should throw error for invalid password", async () => {
		const hashedPassword = await import("argon2").then(argon2 => argon2.hash("password123"));
		mockFindUserByEmail.mockResolvedValue({ ...mockUser, password: hashedPassword });

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
		const hashedPassword = await import("argon2").then(argon2 => argon2.hash("password123"));
		mockFindUserByEmail.mockResolvedValue({ ...mockUser, password: hashedPassword });

		const originalSecret = process.env.JWT_SECRET;
		delete process.env.JWT_SECRET;

		await expect(
			authService.login("admin@test.com", "password123"),
		).rejects.toThrow("JWT_SECRET environment variable is not defined");

		process.env.JWT_SECRET = originalSecret;
	});
});

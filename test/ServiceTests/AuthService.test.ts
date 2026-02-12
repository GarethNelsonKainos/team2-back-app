import { describe, it, expect } from "vitest";
import { AuthService } from "../../src/services/auth.service.js";

describe("AuthService", () => {
	const authService = new AuthService();

	// Ensure JWT_SECRET is set for tests
	process.env.JWT_SECRET = "test-secret-key-for-testing-only";
	process.env.JWT_EXPIRES_IN = "1h";

	it("should return token for valid credentials", async () => {
		const result = await authService.login("admin@test.com", "password123");
		expect(result.token).toBeDefined();
		expect(typeof result.token).toBe("string");
	});

	it("should throw error for invalid password", async () => {
		await expect(
			authService.login("admin@test.com", "wrongpassword"),
		).rejects.toThrow("Invalid credentials");
	});

	it("should throw error for non-existent email", async () => {
		await expect(
			authService.login("fake@test.com", "password123"),
		).rejects.toThrow("Invalid credentials");
	});

	it("should throw error if JWT_SECRET is missing", async () => {
		const originalSecret = process.env.JWT_SECRET;
		delete process.env.JWT_SECRET;

		await expect(
			authService.login("admin@test.com", "password123"),
		).rejects.toThrow("JWT_SECRET environment variable is not defined");

		process.env.JWT_SECRET = originalSecret;
	});
});

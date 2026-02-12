import { describe, it, expect, vi, beforeEach } from "vitest";
import { AuthDao } from "../../src/daos/auth.dao.js";
import { prisma } from "../../src/daos/prisma.js";
import type { User } from "../../src/generated/prisma/client.js";

// Mock the Prisma client
vi.mock("../../src/daos/prisma.js", () => ({
	prisma: {
		user: {
			findUnique: vi.fn(),
		},
	},
}));

describe("AuthDao", () => {
	let dao: AuthDao;
	let mockFindUnique: any;

	beforeEach(() => {
		dao = new AuthDao();
		mockFindUnique = vi.mocked(prisma.user.findUnique);
		mockFindUnique.mockClear();
	});

	describe("findUserByEmail", () => {
		it("should call prisma.user.findUnique with correct where parameter", async () => {
			// Arrange
			const email = "test@test.com";
			const mockUser: User = {
				userId: "550e8400-e29b-41d4-a716-446655440000",
				email: "test@test.com",
				firstName: "Test",
				secondName: "User",
				password: "$argon2id$v=19$m=65536,t=3,p=4$hashedpassword",
				role: "user",
				createdAt: new Date("2026-01-01T00:00:00Z"),
				updatedAt: new Date("2026-01-01T00:00:00Z"),
			};
			mockFindUnique.mockResolvedValue(mockUser);

			// Act
			await dao.findUserByEmail(email);

			// Assert
			expect(mockFindUnique).toHaveBeenCalledOnce();
			expect(mockFindUnique).toHaveBeenCalledWith({
				where: { email },
			});
		});

		it("should return user when email exists", async () => {
			// Arrange
			const email = "admin@test.com";
			const mockUser: User = {
				userId: "550e8400-e29b-41d4-a716-446655440000",
				email: "admin@test.com",
				firstName: "Admin",
				secondName: "User",
				password: "$argon2id$v=19$m=65536,t=3,p=4$hashedpassword",
				role: "admin",
				createdAt: new Date("2026-01-01T00:00:00Z"),
				updatedAt: new Date("2026-01-01T00:00:00Z"),
			};
			mockFindUnique.mockResolvedValue(mockUser);

			// Act
			const result = await dao.findUserByEmail(email);

			// Assert
			expect(result).toEqual(mockUser);
			expect(result?.email).toBe(email);
			expect(result?.role).toBe("admin");
		});

		it("should return null when email does not exist", async () => {
			// Arrange
			const email = "nonexistent@test.com";
			mockFindUnique.mockResolvedValue(null);

			// Act
			const result = await dao.findUserByEmail(email);

			// Assert
			expect(result).toBeNull();
			expect(mockFindUnique).toHaveBeenCalledWith({
				where: { email },
			});
		});

		it("should return user with all required fields", async () => {
			// Arrange
			const email = "user@test.com";
			const mockUser: User = {
				userId: "123e4567-e89b-12d3-a456-426614174000",
				email: "user@test.com",
				firstName: "John",
				secondName: "Doe",
				password: "$argon2id$v=19$m=65536,t=3,p=4$anotherhash",
				role: "user",
				createdAt: new Date("2026-02-01T10:30:00Z"),
				updatedAt: new Date("2026-02-10T15:45:00Z"),
			};
			mockFindUnique.mockResolvedValue(mockUser);

			// Act
			const result = await dao.findUserByEmail(email);

			// Assert
			expect(result).toBeDefined();
			expect(result?.userId).toBe(mockUser.userId);
			expect(result?.email).toBe(mockUser.email);
			expect(result?.firstName).toBe(mockUser.firstName);
			expect(result?.secondName).toBe(mockUser.secondName);
			expect(result?.password).toBe(mockUser.password);
			expect(result?.role).toBe(mockUser.role);
			expect(result?.createdAt).toEqual(mockUser.createdAt);
			expect(result?.updatedAt).toEqual(mockUser.updatedAt);
		});

		it("should handle database errors gracefully", async () => {
			// Arrange
			const email = "error@test.com";
			const dbError = new Error("Database connection failed");
			mockFindUnique.mockRejectedValue(dbError);

			// Act & Assert
			await expect(dao.findUserByEmail(email)).rejects.toThrow(
				"Database connection failed",
			);
		});
	});
});

import { describe, it, expect, vi, beforeEach } from "vitest";
import { JobRoleDao } from "../../src/daos/job-role.dao.js";
import { prisma } from "../../src/daos/prisma.js";
import type { JobRole } from "../../src/generated/prisma/client.js";
import { stat } from "node:fs";

// Mock the Prisma client
vi.mock("../../src/daos/prisma.js", () => ({
	prisma: {
		jobRole: {
			findMany: vi.fn(),
			findUnique: vi.fn(),
		},
	},
}));

describe("JobRoleDao", () => {
	let dao: JobRoleDao;
	let mockFindMany: any;

	beforeEach(() => {
		dao = new JobRoleDao();
		mockFindMany = vi.mocked(prisma.jobRole.findMany);
		mockFindMany.mockClear();
	});

	describe("getOpenJobRoles", () => {
		it("should call prisma.jobRole.findMany with correct include parameters", async () => {
			// Arrange
			const mockJobRoles: JobRole[] = [];
			mockFindMany.mockResolvedValue(mockJobRoles);

			// Act
			await dao.getOpenJobRoles();

			// Assert
			expect(mockFindMany).toHaveBeenCalledOnce();
			expect(mockFindMany).toHaveBeenCalledWith({
				include: {
					capability: true,
					band: true,
					status: true,
				},
			});
		});

		it("should return job roles with capability and band relations", async () => {
			// Arrange
			const mockJobRoles: any[] = [
				{
					jobRoleId: "550e8400-e29b-41d4-a716-446655440000",
					roleName: "Software Engineer",
					location: "Belfast",
					closingDate: new Date("2026-03-15"),
					description: null,
					responsibilities: null,
					sharepointUrl: null,
					numberOfOpenPositions: null,
					capabilityId: "660e8400-e29b-41d4-a716-446655440001",
					bandId: "770e8400-e29b-41d4-a716-446655440002",
					statusId: "880e8400-e29b-41d4-a716-446655440003",
				},
			];
			mockFindMany.mockResolvedValue(mockJobRoles);

			// Act
			const result = await dao.getOpenJobRoles();

			// Assert
			expect(result).toEqual(mockJobRoles);
			expect(result).toHaveLength(1);
			expect(result[0].roleName).toBe("Software Engineer");
		});

		it("should return empty array when no job roles exist", async () => {
			// Arrange
			mockFindMany.mockResolvedValue([]);

			// Act
			const result = await dao.getOpenJobRoles();

			// Assert
			expect(result).toEqual([]);
			expect(result).toHaveLength(0);
		});

		it("should propagate errors from prisma", async () => {
			// Arrange
			const dbError = new Error("Database connection failed");
			mockFindMany.mockRejectedValue(dbError);

			// Act & Assert
			await expect(dao.getOpenJobRoles()).rejects.toThrow(
				"Database connection failed",
			);
		});
	});
	describe("getJobRoleById", () => {
		it("should call prisma.jobRole.findUnique with correct parameters", async () => {
			// Arrange
			const mockJobRole: JobRole = {
				jobRoleId: "550e8400-e29b-41d4-a716-446655440000",
				roleName: "Software Engineer",
				location: "Belfast",
				closingDate: new Date("2026-03-15"),
				description: null,
				responsibilities: null,
				sharepointUrl: null,
				numberOfOpenPositions: null,
				capabilityId: "660e8400-e29b-41d4-a716-446655440001",
				bandId: "770e8400-e29b-41d4-a716-446655440002",
				statusId: "880e8400-e29b-41d4-a716-446655440003",
			};
			vi.mocked(prisma.jobRole.findUnique).mockResolvedValue(mockJobRole);

			// Act
			const result = await dao.getJobRoleById(
				"550e8400-e29b-41d4-a716-446655440000",
			);

			// Assert
			expect(prisma.jobRole.findUnique).toHaveBeenCalledOnce();
			expect(prisma.jobRole.findUnique).toHaveBeenCalledWith({
				where: { jobRoleId: "550e8400-e29b-41d4-a716-446655440000" },
				include: {
					capability: true,
					band: true,
					status: true,
				},
			});
			expect(result).toEqual(mockJobRole);
		});

		it("should return null when job role does not exist", async () => {
			// Arrange
			vi.mocked(prisma.jobRole.findUnique).mockResolvedValue(null);

			// Act
			const result = await dao.getJobRoleById(
				"non-existent-id",
			);

			// Assert
			expect(result).toBeNull();
		});

		it("should propagate errors from prisma", async () => {
			// Arrange
			const dbError = new Error("Database connection failed");
			vi.mocked(prisma.jobRole.findUnique).mockRejectedValue(dbError);

			// Act & Assert
			await expect(
				dao.getJobRoleById("550e8400-e29b-41d4-a716-446655440000"),
			).rejects.toThrow("Database connection failed");
		});
	});
});

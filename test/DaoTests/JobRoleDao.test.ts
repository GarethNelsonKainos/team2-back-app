import { describe, it, expect, vi, beforeEach } from "vitest";
import { JobRoleDao } from "../../src/daos/job-role.dao.js";
import { prisma } from "../../src/daos/prisma.js";
import type { JobRole } from "../../src/generated/prisma/client.js";

// Mock the Prisma client
vi.mock("../../src/daos/prisma.js", () => ({
	prisma: {
		jobRole: {
			findMany: vi.fn(),
			findUnique: vi.fn(),
			create: vi.fn(),
		},
		capability: {
			findMany: vi.fn(),
		},
		band: {
			findMany: vi.fn(),
		},
		status: {
			findFirst: vi.fn(),
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
			const result = await dao.getJobRoleById("non-existent-id");

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

	describe("getAllCapabilities", () => {
		it("should call prisma.capability.findMany with orderBy parameter", async () => {
			// Arrange
			const mockCapabilities: any[] = [
				{ capabilityId: "1", capabilityName: "Engineering" },
				{ capabilityId: "2", capabilityName: "Data" },
			];
			vi.mocked(prisma.capability.findMany).mockResolvedValue(mockCapabilities);

			// Act
			await dao.getAllCapabilities();

			// Assert
			expect(prisma.capability.findMany).toHaveBeenCalledOnce();
			expect(prisma.capability.findMany).toHaveBeenCalledWith({
				orderBy: {
					capabilityName: "asc",
				},
			});
		});

		it("should return list of capabilities", async () => {
			// Arrange
			const mockCapabilities: any[] = [
				{ capabilityId: "1", capabilityName: "Engineering" },
			];
			vi.mocked(prisma.capability.findMany).mockResolvedValue(mockCapabilities);

			// Act
			const result = await dao.getAllCapabilities();

			// Assert
			expect(result).toEqual(mockCapabilities);
		});
	});

	describe("getAllBands", () => {
		it("should call prisma.band.findMany with orderBy parameter", async () => {
			// Arrange
			const mockBands: any[] = [
				{ bandId: "1", bandName: "Consultant" },
				{ bandId: "2", bandName: "Senior Consultant" },
			];
			vi.mocked(prisma.band.findMany).mockResolvedValue(mockBands);

			// Act
			await dao.getAllBands();

			// Assert
			expect(prisma.band.findMany).toHaveBeenCalledOnce();
			expect(prisma.band.findMany).toHaveBeenCalledWith({
				orderBy: {
					bandName: "asc",
				},
			});
		});

		it("should return list of bands", async () => {
			// Arrange
			const mockBands: any[] = [{ bandId: "1", bandName: "Consultant" }];
			vi.mocked(prisma.band.findMany).mockResolvedValue(mockBands);

			// Act
			const result = await dao.getAllBands();

			// Assert
			expect(result).toEqual(mockBands);
		});
	});

	describe("createJobRole", () => {
		it("should create job role with Open status", async () => {
			// Arrange
			const mockStatus = { statusId: "status-1", statusName: "Open" };
			const mockJobRole: any = {
				jobRoleId: "new-job-role-id",
				roleName: "Test Role",
				description: "Test description",
				sharepointUrl: "https://sharepoint.test",
				responsibilities: "Test responsibilities",
				numberOfOpenPositions: 5,
				location: "Belfast",
				closingDate: new Date("2026-12-31"),
				capabilityId: "cap-1",
				bandId: "band-1",
				statusId: "status-1",
			};

			vi.mocked(prisma.status.findFirst).mockResolvedValue(mockStatus);
			vi.mocked(prisma.jobRole.create).mockResolvedValue(mockJobRole);

			// Act
			const result = await dao.createJobRole({
				roleName: "Test Role",
				description: "Test description",
				sharepointUrl: "https://sharepoint.test",
				responsibilities: "Test responsibilities",
				numberOfOpenPositions: 5,
				location: "Belfast",
				closingDate: new Date("2026-12-31"),
				capabilityId: "cap-1",
				bandId: "band-1",
			});

			// Assert
			expect(prisma.status.findFirst).toHaveBeenCalledWith({
				where: { statusName: "Open" },
			});
			expect(prisma.jobRole.create).toHaveBeenCalledWith({
				data: {
					roleName: "Test Role",
					description: "Test description",
					sharepointUrl: "https://sharepoint.test",
					responsibilities: "Test responsibilities",
					numberOfOpenPositions: 5,
					location: "Belfast",
					closingDate: new Date("2026-12-31"),
					capabilityId: "cap-1",
					bandId: "band-1",
					statusId: "status-1",
				},
				include: {
					capability: true,
					band: true,
					status: true,
				},
			});
			expect(result).toEqual(mockJobRole);
		});

		it("should throw error when Open status not found", async () => {
			// Arrange
			vi.mocked(prisma.status.findFirst).mockResolvedValue(null);

			// Act & Assert
			await expect(
				dao.createJobRole({
					roleName: "Test Role",
					description: "Test description",
					sharepointUrl: "https://sharepoint.test",
					responsibilities: "Test responsibilities",
					numberOfOpenPositions: 5,
					location: "Belfast",
					closingDate: new Date("2026-12-31"),
					capabilityId: "cap-1",
					bandId: "band-1",
				}),
			).rejects.toThrow("Open status not found in database");
		});
	});
});

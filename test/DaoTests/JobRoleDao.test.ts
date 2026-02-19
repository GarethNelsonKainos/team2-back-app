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
			update: vi.fn(),
		},
		capability: {
			findMany: vi.fn(),
		},
		band: {
			findMany: vi.fn(),
		},
		status: {
			findFirst: vi.fn(),
			findMany: vi.fn(),
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

	describe("getAllStatuses", () => {
		it("should call prisma.status.findMany with correct orderBy parameter", async () => {
			const mockStatuses = [
				{ statusId: "1", statusName: "Closed" },
				{ statusId: "2", statusName: "In Progress" },
				{ statusId: "3", statusName: "Open" },
			];
			const mockFindMany = vi.mocked(prisma.status.findMany);
			mockFindMany.mockResolvedValue(mockStatuses);

			await dao.getAllStatuses();

			expect(mockFindMany).toHaveBeenCalledWith({
				orderBy: {
					statusName: "asc",
				},
			});
		});

		it("should return statuses ordered by name", async () => {
			const mockStatuses = [
				{ statusId: "1", statusName: "Closed" },
				{ statusId: "2", statusName: "In Progress" },
				{ statusId: "3", statusName: "Open" },
			];
			const mockFindMany = vi.mocked(prisma.status.findMany);
			mockFindMany.mockResolvedValue(mockStatuses);

			const result = await dao.getAllStatuses();

			expect(result).toEqual(mockStatuses);
			expect(result).toHaveLength(3);
		});

		it("should return empty array when no statuses exist", async () => {
			const mockFindMany = vi.mocked(prisma.status.findMany);
			mockFindMany.mockResolvedValue([]);

			const result = await dao.getAllStatuses();

			expect(result).toEqual([]);
		});
	});

	describe("updateJobRole", () => {
		it("should check if job role exists before updating", async () => {
			const mockFindUnique = vi.mocked(prisma.jobRole.findUnique);
			const mockUpdate = vi.mocked(prisma.jobRole.update);

			mockFindUnique.mockResolvedValue({
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
			});

			mockUpdate.mockResolvedValue({
				jobRoleId: "550e8400-e29b-41d4-a716-446655440000",
				roleName: "Updated Engineer",
				location: "Belfast",
				closingDate: new Date("2026-03-15"),
				description: null,
				responsibilities: null,
				sharepointUrl: null,
				numberOfOpenPositions: null,
				capabilityId: "660e8400-e29b-41d4-a716-446655440001",
				bandId: "770e8400-e29b-41d4-a716-446655440002",
				statusId: "880e8400-e29b-41d4-a716-446655440003",
			});

			await dao.updateJobRole("550e8400-e29b-41d4-a716-446655440000", {
				roleName: "Updated Engineer",
			});

			expect(mockFindUnique).toHaveBeenCalledWith({
				where: { jobRoleId: "550e8400-e29b-41d4-a716-446655440000" },
			});
		});

		it("should return null when job role does not exist", async () => {
			const mockFindUnique = vi.mocked(prisma.jobRole.findUnique);
			mockFindUnique.mockResolvedValue(null);

			const result = await dao.updateJobRole("non-existent-id", {
				roleName: "Updated Name",
			});

			expect(result).toBeNull();
		});

		it("should call prisma.jobRole.update with correct parameters", async () => {
			const mockFindUnique = vi.mocked(prisma.jobRole.findUnique);
			const mockUpdate = vi.mocked(prisma.jobRole.update);

			mockFindUnique.mockResolvedValue({
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
			});

			const updateInput = {
				roleName: "Updated Engineer",
				location: "London",
			};

			mockUpdate.mockResolvedValue({
				jobRoleId: "550e8400-e29b-41d4-a716-446655440000",
				roleName: "Updated Engineer",
				location: "London",
				closingDate: new Date("2026-03-15"),
				description: null,
				responsibilities: null,
				sharepointUrl: null,
				numberOfOpenPositions: null,
				capabilityId: "660e8400-e29b-41d4-a716-446655440001",
				bandId: "770e8400-e29b-41d4-a716-446655440002",
				statusId: "880e8400-e29b-41d4-a716-446655440003",
			});

			await dao.updateJobRole(
				"550e8400-e29b-41d4-a716-446655440000",
				updateInput,
			);

			expect(mockUpdate).toHaveBeenCalledWith({
				where: { jobRoleId: "550e8400-e29b-41d4-a716-446655440000" },
				data: updateInput,
				include: {
					capability: true,
					band: true,
					status: true,
				},
			});
		});

		it("should return updated job role with relations", async () => {
			const mockFindUnique = vi.mocked(prisma.jobRole.findUnique);
			const mockUpdate = vi.mocked(prisma.jobRole.update);

			mockFindUnique.mockResolvedValue({
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
			});

			const mockUpdatedJobRole: any = {
				jobRoleId: "550e8400-e29b-41d4-a716-446655440000",
				roleName: "Updated Engineer",
				location: "London",
				closingDate: new Date("2026-03-15"),
				description: null,
				responsibilities: null,
				sharepointUrl: null,
				numberOfOpenPositions: null,
				capabilityId: "660e8400-e29b-41d4-a716-446655440001",
				bandId: "770e8400-e29b-41d4-a716-446655440002",
				statusId: "880e8400-e29b-41d4-a716-446655440003",
				capability: {
					capabilityId: "660e8400-e29b-41d4-a716-446655440001",
					capabilityName: "Engineering",
				},
				band: {
					bandId: "770e8400-e29b-41d4-a716-446655440002",
					bandName: "Consultant",
				},
				status: {
					statusId: "880e8400-e29b-41d4-a716-446655440003",
					statusName: "Open",
				},
			};

			mockUpdate.mockResolvedValue(mockUpdatedJobRole);

			const result = await dao.updateJobRole(
				"550e8400-e29b-41d4-a716-446655440000",
				{
					roleName: "Updated Engineer",
					location: "London",
				},
			);

			expect(result).toEqual(mockUpdatedJobRole);
			expect((result as any)?.capability).toBeDefined();
			expect((result as any)?.band).toBeDefined();
			expect((result as any)?.status).toBeDefined();
		});

		it("should handle partial updates with single field", async () => {
			const mockFindUnique = vi.mocked(prisma.jobRole.findUnique);
			const mockUpdate = vi.mocked(prisma.jobRole.update);

			mockFindUnique.mockResolvedValue({
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
			});

			mockUpdate.mockResolvedValue({
				jobRoleId: "550e8400-e29b-41d4-a716-446655440000",
				roleName: "Software Engineer",
				location: "Belfast",
				closingDate: new Date("2026-03-15"),
				description: null,
				responsibilities: null,
				sharepointUrl: null,
				numberOfOpenPositions: 10,
				capabilityId: "660e8400-e29b-41d4-a716-446655440001",
				bandId: "770e8400-e29b-41d4-a716-446655440002",
				statusId: "880e8400-e29b-41d4-a716-446655440003",
			});

			const result = await dao.updateJobRole(
				"550e8400-e29b-41d4-a716-446655440000",
				{
					numberOfOpenPositions: 10,
				},
			);

			expect(result?.numberOfOpenPositions).toBe(10);
		});
	});
});

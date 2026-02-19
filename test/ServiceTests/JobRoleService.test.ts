import { describe, it, expect, vi, beforeEach } from "vitest";
import { JobRoleService } from "../../src/services/job-role.service.js";
import { JobRoleDao } from "../../src/daos/job-role.dao.js";

// Mock the DAO module
vi.mock("../../src/daos/job-role.dao.js");
vi.mock("../../src/daos/job-role.dao.js");

describe("JobRoleService", () => {
	let service: JobRoleService;
	let mockGetOpenJobRoles: any;
	let mockGetJobRoleById: any;
	let mockGetAllCapabilities: any;
	let mockGetAllBands: any;
	let mockCreateJobRole: any;
	let mockGetAllStatuses: any;
	let mockUpdateJobRole: any;
	let mockDeleteJobRole: any;

	const mockDaoResponse = [
		{
			jobRoleId: "550e8400-e29b-41d4-a716-446655440000",
			roleName: "Software Engineer",
			location: "Belfast",
			capabilityId: "660e8400-e29b-41d4-a716-446655440001",
			bandId: "770e8400-e29b-41d4-a716-446655440002",
			closingDate: new Date("2026-03-15"),
			capability: {
				capabilityId: "660e8400-e29b-41d4-a716-446655440001",
				capabilityName: "Engineering",
				jobRoles: [],
			},
			band: {
				nameId: "770e8400-e29b-41d4-a716-446655440002",
				bandName: "Consultant",
				jobRoles: [],
			},
			status: {
				statusId: "880e8400-e29b-41d4-a716-446655440003",
				statusName: "Open",
				jobRoles: [],
			},
		},
	];

	const mockStatusesResponse = [
		{
			statusId: "880e8400-e29b-41d4-a716-446655440003",
			statusName: "Open",
		},
		{
			statusId: "880e8400-e29b-41d4-a716-446655440004",
			statusName: "Closed",
		},
		{
			statusId: "880e8400-e29b-41d4-a716-446655440005",
			statusName: "In Progress",
		},
	];

	const mockUpdatedJobRole = {
		jobRoleId: "550e8400-e29b-41d4-a716-446655440000",
		roleName: "Updated Software Engineer",
		location: "London",
		closingDate: new Date("2026-04-30"),
		description: "Updated description",
		responsibilities: "Updated responsibilities",
		sharepointUrl: "https://updated-link.com",
		numberOfOpenPositions: 5,
		capabilityId: "660e8400-e29b-41d4-a716-446655440001",
		bandId: "770e8400-e29b-41d4-a716-446655440002",
		statusId: "880e8400-e29b-41d4-a716-446655440004",
		capability: {
			capabilityId: "660e8400-e29b-41d4-a716-446655440001",
			capabilityName: "Engineering",
			jobRoles: [],
		},
		band: {
			bandId: "770e8400-e29b-41d4-a716-446655440002",
			bandName: "Consultant",
			jobRoles: [],
		},
		status: {
			statusId: "880e8400-e29b-41d4-a716-446655440004",
			statusName: "Closed",
			jobRoles: [],
		},
	};

	beforeEach(() => {
		// Create mock function for DAO method
		mockGetOpenJobRoles = vi.fn().mockResolvedValue(mockDaoResponse);
		mockGetJobRoleById = vi.fn();
		mockGetAllCapabilities = vi.fn();
		mockGetAllBands = vi.fn();
		mockCreateJobRole = vi.fn();
		mockGetAllStatuses = vi.fn();
		mockUpdateJobRole = vi.fn();
		mockDeleteJobRole = vi.fn();

		// Mock the DAO class
		JobRoleDao.prototype.getOpenJobRoles = mockGetOpenJobRoles;
		JobRoleDao.prototype.getJobRoleById = mockGetJobRoleById;
		JobRoleDao.prototype.getAllCapabilities = mockGetAllCapabilities;
		JobRoleDao.prototype.getAllBands = mockGetAllBands;
		JobRoleDao.prototype.createJobRole = mockCreateJobRole;
		JobRoleDao.prototype.getAllStatuses = mockGetAllStatuses;
		JobRoleDao.prototype.updateJobRole = mockUpdateJobRole;
		JobRoleDao.prototype.deleteJobRole = mockDeleteJobRole;

		service = new JobRoleService();
	});

	describe("getOpenJobRoles", () => {
		it("should return JobRole array with nested relations", async () => {
			// Act
			const result = await service.getOpenJobRoles();

			// Assert
			expect(result).toHaveLength(1);
			expect(result[0]).toEqual({
				jobRoleId: "550e8400-e29b-41d4-a716-446655440000",
				roleName: "Software Engineer",
				location: "Belfast",
				capabilityId: "660e8400-e29b-41d4-a716-446655440001",
				bandId: "770e8400-e29b-41d4-a716-446655440002",
				closingDate: new Date("2026-03-15"),
				capability: {
					capabilityId: "660e8400-e29b-41d4-a716-446655440001",
					capabilityName: "Engineering",
					jobRoles: [],
				},
				band: {
					nameId: "770e8400-e29b-41d4-a716-446655440002",
					bandName: "Consultant",
					jobRoles: [],
				},
				status: {
					statusId: "880e8400-e29b-41d4-a716-446655440003",
					statusName: "Open",
					jobRoles: [],
				},
			});
		});

		it("should call DAO getOpenJobRoles method", async () => {
			// Act
			await service.getOpenJobRoles();

			// Assert
			expect(mockGetOpenJobRoles).toHaveBeenCalledTimes(1);
		});

		it("should handle empty results from DAO", async () => {
			// Arrange
			mockGetOpenJobRoles.mockResolvedValue([]);

			// Act
			const result = await service.getOpenJobRoles();

			// Assert
			expect(result).toEqual([]);
		});
	});

	describe("getJobRoleById", () => {
		it("should return a single JobRole when found", async () => {
			// Arrange
			const mockJobRole = {
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
			mockGetJobRoleById.mockResolvedValue(mockJobRole);

			// Act
			const result = await service.getJobRoleById(
				"550e8400-e29b-41d4-a716-446655440000",
			);

			// Assert
			expect(result).toEqual(mockJobRole);
			expect(mockGetJobRoleById).toHaveBeenCalledWith(
				"550e8400-e29b-41d4-a716-446655440000",
			);
		});

		it("should return null when job role does not exist", async () => {
			// Arrange
			mockGetJobRoleById.mockResolvedValue(null);

			// Act
			const result = await service.getJobRoleById("non-existent-id");

			// Assert
			expect(result).toBeNull();
			expect(mockGetJobRoleById).toHaveBeenCalledWith("non-existent-id");
		});

		it("should call DAO getJobRoleById method with correct id", async () => {
			// Arrange
			const testId = "550e8400-e29b-41d4-a716-446655440000";
			mockGetJobRoleById.mockResolvedValue(null);

			// Act
			await service.getJobRoleById(testId);

			// Assert
			expect(mockGetJobRoleById).toHaveBeenCalledTimes(1);
			expect(mockGetJobRoleById).toHaveBeenCalledWith(testId);
		});
	});

	describe("getAllCapabilities", () => {
		it("should return list of capabilities", async () => {
			// Arrange
			const mockCapabilities = [
				{ capabilityId: "1", capabilityName: "Engineering", jobRoles: [] },
				{ capabilityId: "2", capabilityName: "Data", jobRoles: [] },
			];
			mockGetAllCapabilities.mockResolvedValue(mockCapabilities);

			// Act
			const result = await service.getAllCapabilities();

			// Assert
			expect(result).toEqual(mockCapabilities);
			expect(mockGetAllCapabilities).toHaveBeenCalledTimes(1);
		});
	});

	describe("getAllBands", () => {
		it("should return list of bands", async () => {
			// Arrange
			const mockBands = [
				{ bandId: "1", bandName: "Consultant", jobRoles: [] },
				{ bandId: "2", bandName: "Senior Consultant", jobRoles: [] },
			];
			mockGetAllBands.mockResolvedValue(mockBands);

			// Act
			const result = await service.getAllBands();

			// Assert
			expect(result).toEqual(mockBands);
			expect(mockGetAllBands).toHaveBeenCalledTimes(1);
		});
	});

	describe("createJobRole", () => {
		it("should create and return new job role", async () => {
			// Arrange
			const mockInput = {
				roleName: "Test Role",
				description: "Test description",
				sharepointUrl: "https://sharepoint.test",
				responsibilities: "Test responsibilities",
				numberOfOpenPositions: 5,
				location: "Belfast",
				closingDate: new Date("2026-12-31"),
				capabilityId: "cap-1",
				bandId: "band-1",
			};
			const mockCreatedJobRole = {
				jobRoleId: "new-id",
				...mockInput,
				statusId: "status-1",
			};
			mockCreateJobRole.mockResolvedValue(mockCreatedJobRole);

			// Act
			const result = await service.createJobRole(mockInput);

			// Assert
			expect(result).toEqual(mockCreatedJobRole);
			expect(mockCreateJobRole).toHaveBeenCalledWith(mockInput);
		});
	});

	describe("getAllStatuses", () => {
		it("should return all statuses from DAO", async () => {
			mockGetAllStatuses.mockResolvedValue(mockStatusesResponse);

			const result = await service.getAllStatuses();

			expect(result).toEqual(mockStatusesResponse);
			expect(result).toHaveLength(3);
		});

		it("should call DAO getAllStatuses method", async () => {
			mockGetAllStatuses.mockResolvedValue(mockStatusesResponse);

			await service.getAllStatuses();

			expect(mockGetAllStatuses).toHaveBeenCalledTimes(1);
		});

		it("should return empty array when no statuses exist", async () => {
			mockGetAllStatuses.mockResolvedValue([]);

			const result = await service.getAllStatuses();

			expect(result).toEqual([]);
		});
	});

	describe("updateJobRole", () => {
		it("should return updated job role from DAO", async () => {
			const updateInput = {
				roleName: "Updated Software Engineer",
				location: "London",
			};
			mockUpdateJobRole.mockResolvedValue(mockUpdatedJobRole);

			const result = await service.updateJobRole(
				"550e8400-e29b-41d4-a716-446655440000",
				updateInput,
			);

			expect(result).toEqual(mockUpdatedJobRole);
		});

		it("should call DAO updateJobRole with correct parameters", async () => {
			const updateInput = {
				roleName: "Updated Software Engineer",
				location: "London",
			};
			mockUpdateJobRole.mockResolvedValue(mockUpdatedJobRole);

			await service.updateJobRole(
				"550e8400-e29b-41d4-a716-446655440000",
				updateInput,
			);

			expect(mockUpdateJobRole).toHaveBeenCalledWith(
				"550e8400-e29b-41d4-a716-446655440000",
				updateInput,
			);
		});

		it("should return null when job role not found", async () => {
			const updateInput = { roleName: "Updated Name" };
			mockUpdateJobRole.mockResolvedValue(null);

			const result = await service.updateJobRole(
				"non-existent-id",
				updateInput,
			);

			expect(result).toBeNull();
		});

		it("should handle partial updates", async () => {
			const updateInput = { numberOfOpenPositions: 10 };
			mockUpdateJobRole.mockResolvedValue({
				...mockUpdatedJobRole,
				numberOfOpenPositions: 10,
			});

			const result = await service.updateJobRole(
				"550e8400-e29b-41d4-a716-446655440000",
				updateInput,
			);

			expect(result).toBeDefined();
			expect(result?.numberOfOpenPositions).toBe(10);
		});
	});

	describe("deleteJobRole", () => {
		it("should call DAO deleteJobRole and return deleted job role", async () => {
			// Arrange
			const mockDeletedJobRole = {
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
			mockDeleteJobRole.mockResolvedValue(mockDeletedJobRole);

			// Act
			const result = await service.deleteJobRole(
				"550e8400-e29b-41d4-a716-446655440000",
			);

			// Assert
			expect(mockDeleteJobRole).toHaveBeenCalledOnce();
			expect(mockDeleteJobRole).toHaveBeenCalledWith(
				"550e8400-e29b-41d4-a716-446655440000",
			);
			expect(result).toEqual(mockDeletedJobRole);
		});

		it("should return null when DAO returns null (job role not found)", async () => {
			// Arrange
			mockDeleteJobRole.mockResolvedValue(null);

			// Act
			const result = await service.deleteJobRole("non-existent-id");

			// Assert
			expect(result).toBeNull();
		});

		it("should propagate errors from DAO layer", async () => {
			// Arrange
			const daoError = new Error("Database error");
			mockDeleteJobRole.mockRejectedValue(daoError);

			// Act & Assert
			await expect(
				service.deleteJobRole("550e8400-e29b-41d4-a716-446655440000"),
			).rejects.toThrow("Database error");
		});
	});
});

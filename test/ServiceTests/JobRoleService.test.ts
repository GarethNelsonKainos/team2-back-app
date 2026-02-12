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

	beforeEach(() => {
		// Create mock function for DAO method
		mockGetOpenJobRoles = vi.fn().mockResolvedValue(mockDaoResponse);
		mockGetJobRoleById = vi.fn();

		// Mock the DAO class
		JobRoleDao.prototype.getOpenJobRoles = mockGetOpenJobRoles;
		JobRoleDao.prototype.getJobRoleById = mockGetJobRoleById;

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
});

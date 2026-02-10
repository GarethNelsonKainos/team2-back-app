import { describe, it, expect, vi, beforeEach } from "vitest";
import { JobRoleService } from "../../src/services/job-role.service.js";
import { JobRoleDao } from "../../src/daos/job-role.dao.js";

// Mock the DAO module
vi.mock("../../src/daos/job-role.dao.js");

describe("JobRoleService", () => {
	let service: JobRoleService;
	let mockGetOpenJobRoles: any;

	const mockDaoResponse = {
		jobRoles: [
			{
				jobRoleId: 1,
				roleName: "Software Engineer",
				location: "Belfast",
				capabilityId: 1,
				bandId: 2,
				closingDate: new Date("2026-03-15"),
				status: "open",
			},
		],
		capabilities: [{ capabilityId: 1, capabilityName: "Engineering" }],
		bands: [{ bandId: 2, bandName: "Consultant" }],
	};

	beforeEach(() => {
		// Create mock function for DAO method
		mockGetOpenJobRoles = vi.fn().mockResolvedValue(mockDaoResponse);

		// Mock the DAO class
		JobRoleDao.prototype.getOpenJobRoles = mockGetOpenJobRoles;

		service = new JobRoleService();
	});

	describe("getOpenJobRoles", () => {
		it("should return JobRoleResponse array with correct data", async () => {
			// Act
			const result = await service.getOpenJobRoles();

			// Assert
			expect(result).toHaveLength(1);
			expect(result[0]).toEqual({
				jobRoleId: 1,
				roleName: "Software Engineer",
				location: "Belfast",
				capability: "Engineering",
				band: "Consultant",
				closingDate: "2026-03-15",
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
			const emptyResponse = {
				jobRoles: [],
				capabilities: [],
				bands: [],
			};

			mockGetOpenJobRoles.mockResolvedValue(emptyResponse);

			// Act
			const result = await service.getOpenJobRoles();

			// Assert
			expect(result).toEqual([]);
		});
	});
});

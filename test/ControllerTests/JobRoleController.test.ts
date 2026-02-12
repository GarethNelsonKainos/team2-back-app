import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Request, Response } from "express";
import { JobRoleController } from "../../src/controllers/job-role.controller.js";
import { JobRoleService } from "../../src/services/job-role.service.js";

// Mock the Service module
vi.mock("../../src/services/job-role.service.js");

type JobRoleParams = { id: string };

describe("JobRoleController", () => {
	let controller: JobRoleController;
	let mockRequest: Partial<Request>;
	let mockResponse: Partial<Response>;
	let mockGetOpenJobRoles: any;
	let mockGetJobRoleById: any;

	const mockJobRoleResponse = [
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
				statusId: "880e8400-e29b-41d4-a716-446655440003",
				statusName: "Open",
				jobRoles: [],
			},
		},
	];

	beforeEach(() => {
		// Create mock request and response
		mockRequest = {};
		mockResponse = {
			status: vi.fn().mockReturnThis(),
			json: vi.fn().mockReturnThis(),
			send: vi.fn().mockReturnThis(),
		};
		// Create mock function for Service method
		mockGetOpenJobRoles = vi.fn().mockResolvedValue(mockJobRoleResponse);
		mockGetJobRoleById = vi.fn();

		// Mock the Service class
		JobRoleService.prototype.getOpenJobRoles = mockGetOpenJobRoles;
		JobRoleService.prototype.getJobRoleById = mockGetJobRoleById;

		controller = new JobRoleController();
	});

	describe("getJobRoles", () => {
		it("should return 200 status with job roles data", async () => {
			await controller.getJobRoles(
				mockRequest as Request,
				mockResponse as Response,
			);

			expect(mockResponse.status).toHaveBeenCalledWith(200);
			expect(mockResponse.json).toHaveBeenCalledWith(mockJobRoleResponse);
		});

		it("should call service getOpenJobRoles method", async () => {
			await controller.getJobRoles(
				mockRequest as Request,
				mockResponse as Response,
			);

			expect(mockGetOpenJobRoles).toHaveBeenCalledTimes(1);
		});

		it("should return 500 status when service throws an error", async () => {
			const error = new Error("Service error");
			mockGetOpenJobRoles.mockRejectedValue(error);

			await controller.getJobRoles(
				mockRequest as Request,
				mockResponse as Response,
			);

			expect(mockResponse.status).toHaveBeenCalledWith(500);
			expect(mockResponse.send).toHaveBeenCalled();
		});

		it("should handle empty job roles array", async () => {
			mockGetOpenJobRoles.mockResolvedValue([]);

			await controller.getJobRoles(
				mockRequest as Request,
				mockResponse as Response,
			);

			expect(mockResponse.status).toHaveBeenCalledWith(200);
			expect(mockResponse.json).toHaveBeenCalledWith([]);
		});
	});

	describe("getJobRoleById", () => {
		it("should return 200 status with job role data when role exists", async () => {
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
					statusId: "880e8400-e29b-41d4-a716-446655440003",
					statusName: "Open",
					jobRoles: [],
				},
			};
			mockGetJobRoleById.mockResolvedValue(mockJobRole);
			mockRequest = {
				params: { id: "550e8400-e29b-41d4-a716-446655440000" },
			};

			await controller.getJobRoleById(
				mockRequest as Request<JobRoleParams>,
				mockResponse as Response,
			);

			expect(mockResponse.status).toHaveBeenCalledWith(200);
			expect(mockResponse.json).toHaveBeenCalledWith(mockJobRole);
		});

		it("should return 404 status when job role does not exist", async () => {
			mockGetJobRoleById.mockResolvedValue(null);
			mockRequest = {
				params: { id: "non-existent-id" },
			};

			await controller.getJobRoleById(
				mockRequest as Request<JobRoleParams>,
				mockResponse as Response,
			);

			expect(mockResponse.status).toHaveBeenCalledWith(404);
			expect(mockResponse.send).toHaveBeenCalled();
		});

		it("should return 500 status when service throws an error", async () => {
			const error = new Error("Service error");
			mockGetJobRoleById.mockRejectedValue(error);
			mockRequest = {
				params: { id: "1" },
			};

			await controller.getJobRoleById(
				mockRequest as Request<JobRoleParams>,
				mockResponse as Response,
			);

			expect(mockResponse.status).toHaveBeenCalledWith(500);
			expect(mockResponse.send).toHaveBeenCalled();
		});
	});
});

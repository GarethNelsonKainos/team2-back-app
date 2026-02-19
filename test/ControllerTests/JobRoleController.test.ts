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
	let mockGetAllCapabilities: any;
	let mockGetAllBands: any;
	let mockCreateJobRole: any;
	let mockGetAllStatuses: any;
	let mockUpdateJobRole: any;
	let mockDeleteJobRole: any;

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
		mockGetAllCapabilities = vi.fn();
		mockGetAllBands = vi.fn();
		mockCreateJobRole = vi.fn();
		mockGetAllStatuses = vi.fn();
		mockUpdateJobRole = vi.fn();
		mockDeleteJobRole = vi.fn();

		// Mock the Service class
		JobRoleService.prototype.getOpenJobRoles = mockGetOpenJobRoles;
		JobRoleService.prototype.getJobRoleById = mockGetJobRoleById;
		JobRoleService.prototype.getAllCapabilities = mockGetAllCapabilities;
		JobRoleService.prototype.getAllBands = mockGetAllBands;
		JobRoleService.prototype.createJobRole = mockCreateJobRole;
		JobRoleService.prototype.getAllStatuses = mockGetAllStatuses;
		JobRoleService.prototype.updateJobRole = mockUpdateJobRole;
		JobRoleService.prototype.deleteJobRole = mockDeleteJobRole;

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

	describe("getCapabilities", () => {
		it("should return 200 status with capabilities data", async () => {
			// Arrange
			const mockCapabilities = [
				{ capabilityId: "1", capabilityName: "Engineering" },
				{ capabilityId: "2", capabilityName: "Data" },
			];
			mockGetAllCapabilities.mockResolvedValue(mockCapabilities);

			// Act
			await controller.getCapabilities(
				mockRequest as Request,
				mockResponse as Response,
			);

			// Assert
			expect(mockResponse.status).toHaveBeenCalledWith(200);
			expect(mockResponse.json).toHaveBeenCalledWith(mockCapabilities);
		});

		it("should return 500 status when service throws an error", async () => {
			// Arrange
			const error = new Error("Service error");
			mockGetAllCapabilities.mockRejectedValue(error);

			// Act
			await controller.getCapabilities(
				mockRequest as Request,
				mockResponse as Response,
			);

			// Assert
			expect(mockResponse.status).toHaveBeenCalledWith(500);
			expect(mockResponse.send).toHaveBeenCalled();
		});
	});

	describe("getBands", () => {
		it("should return 200 status with bands data", async () => {
			// Arrange
			const mockBands = [
				{ bandId: "1", bandName: "Consultant" },
				{ bandId: "2", bandName: "Senior Consultant" },
			];
			mockGetAllBands.mockResolvedValue(mockBands);

			// Act
			await controller.getBands(
				mockRequest as Request,
				mockResponse as Response,
			);

			// Assert
			expect(mockResponse.status).toHaveBeenCalledWith(200);
			expect(mockResponse.json).toHaveBeenCalledWith(mockBands);
		});

		it("should return 500 status when service throws an error", async () => {
			// Arrange
			const error = new Error("Service error");
			mockGetAllBands.mockRejectedValue(error);

			// Act
			await controller.getBands(
				mockRequest as Request,
				mockResponse as Response,
			);

			// Assert
			expect(mockResponse.status).toHaveBeenCalledWith(500);
			expect(mockResponse.send).toHaveBeenCalled();
		});
	});

	describe("createJobRole", () => {
		it("should return 201 status with created job role", async () => {
			// Arrange
			const mockCreatedJobRole = {
				jobRoleId: "new-id",
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
			mockCreateJobRole.mockResolvedValue(mockCreatedJobRole);
			mockRequest = {
				body: {
					roleName: "Test Role",
					description: "Test description",
					sharepointUrl: "https://sharepoint.test",
					responsibilities: "Test responsibilities",
					numberOfOpenPositions: 5,
					location: "Belfast",
					closingDate: "2026-12-31",
					capabilityId: "cap-1",
					bandId: "band-1",
				},
			};

			// Act
			await controller.createJobRole(
				mockRequest as Request,
				mockResponse as Response,
			);

			// Assert
			expect(mockResponse.status).toHaveBeenCalledWith(201);
			expect(mockResponse.json).toHaveBeenCalledWith(mockCreatedJobRole);
		});

		it("should return 400 when role name is missing", async () => {
			// Arrange
			mockRequest = { body: {} };

			// Act
			await controller.createJobRole(
				mockRequest as Request,
				mockResponse as Response,
			);

			// Assert
			expect(mockResponse.status).toHaveBeenCalledWith(400);
			expect(mockResponse.json).toHaveBeenCalledWith({
				error: "Role name is required",
			});
		});

		it("should return 400 when SharePoint URL format is invalid", async () => {
			// Arrange
			mockRequest = {
				body: {
					roleName: "Test Role",
					description: "Test description",
					sharepointUrl: "invalid-url",
					responsibilities: "Test responsibilities",
					numberOfOpenPositions: 5,
					location: "Belfast",
					closingDate: "2026-12-31",
					capabilityId: "cap-1",
					bandId: "band-1",
				},
			};

			// Act
			await controller.createJobRole(
				mockRequest as Request,
				mockResponse as Response,
			);

			// Assert
			expect(mockResponse.status).toHaveBeenCalledWith(400);
			expect(mockResponse.json).toHaveBeenCalledWith({
				error: "Invalid SharePoint URL format",
			});
		});

		it("should return 400 when closing date is in the past", async () => {
			// Arrange
			mockRequest = {
				body: {
					roleName: "Test Role",
					description: "Test description",
					sharepointUrl: "https://sharepoint.test",
					responsibilities: "Test responsibilities",
					numberOfOpenPositions: 5,
					location: "Belfast",
					closingDate: "2020-01-01",
					capabilityId: "cap-1",
					bandId: "band-1",
				},
			};

			// Act
			await controller.createJobRole(
				mockRequest as Request,
				mockResponse as Response,
			);

			// Assert
			expect(mockResponse.status).toHaveBeenCalledWith(400);
			expect(mockResponse.json).toHaveBeenCalledWith({
				error: "Closing date must be in the future",
			});
		});

		it("should return 400 when numberOfOpenPositions is less than 1", async () => {
			// Arrange
			mockRequest = {
				body: {
					roleName: "Test Role",
					description: "Test description",
					sharepointUrl: "https://sharepoint.test",
					responsibilities: "Test responsibilities",
					numberOfOpenPositions: 0,
					location: "Belfast",
					closingDate: "2026-12-31",
					capabilityId: "cap-1",
					bandId: "band-1",
				},
			};

			// Act
			await controller.createJobRole(
				mockRequest as Request,
				mockResponse as Response,
			);

			// Assert
			expect(mockResponse.status).toHaveBeenCalledWith(400);
			expect(mockResponse.json).toHaveBeenCalledWith({
				error: "Number of open positions must be at least 1",
			});
		});

		it("should return 500 status when service throws an error", async () => {
			// Arrange
			const error = new Error("Service error");
			mockCreateJobRole.mockRejectedValue(error);
			mockRequest = {
				body: {
					roleName: "Test Role",
					description: "Test description",
					sharepointUrl: "https://sharepoint.test",
					responsibilities: "Test responsibilities",
					numberOfOpenPositions: 5,
					location: "Belfast",
					closingDate: "2026-12-31",
					capabilityId: "cap-1",
					bandId: "band-1",
				},
			};

			// Act
			await controller.createJobRole(
				mockRequest as Request,
				mockResponse as Response,
			);

			// Assert
			expect(mockResponse.status).toHaveBeenCalledWith(500);
		});
	});

	describe("getStatuses", () => {
		it("should return 200 status with statuses data", async () => {
			mockGetAllStatuses.mockResolvedValue(mockStatusesResponse);

			await controller.getStatuses(
				mockRequest as Request,
				mockResponse as Response,
			);

			expect(mockResponse.status).toHaveBeenCalledWith(200);
			expect(mockResponse.json).toHaveBeenCalledWith(mockStatusesResponse);
		});

		it("should call service getAllStatuses method", async () => {
			mockGetAllStatuses.mockResolvedValue(mockStatusesResponse);

			await controller.getStatuses(
				mockRequest as Request,
				mockResponse as Response,
			);

			expect(mockGetAllStatuses).toHaveBeenCalledTimes(1);
		});

		it("should return 500 status when service throws an error", async () => {
			const error = new Error("Service error");
			mockGetAllStatuses.mockRejectedValue(error);

			await controller.getStatuses(
				mockRequest as Request,
				mockResponse as Response,
			);

			expect(mockResponse.status).toHaveBeenCalledWith(500);
			expect(mockResponse.send).toHaveBeenCalled();
		});
	});

	describe("updateJobRole", () => {
		beforeEach(() => {
			mockRequest = {
				params: { id: "550e8400-e29b-41d4-a716-446655440000" },
				body: {
					roleName: "Updated Software Engineer",
					location: "London",
				},
			};
		});

		it("should return 200 status with updated job role", async () => {
			mockUpdateJobRole.mockResolvedValue(mockUpdatedJobRole);

			await controller.updateJobRole(
				mockRequest as Request<JobRoleParams>,
				mockResponse as Response,
			);

			expect(mockResponse.status).toHaveBeenCalledWith(200);
			expect(mockResponse.json).toHaveBeenCalledWith(mockUpdatedJobRole);
		});

		it("should call service updateJobRole with correct parameters", async () => {
			mockUpdateJobRole.mockResolvedValue(mockUpdatedJobRole);

			await controller.updateJobRole(
				mockRequest as Request<JobRoleParams>,
				mockResponse as Response,
			);

			expect(mockUpdateJobRole).toHaveBeenCalledWith(
				"550e8400-e29b-41d4-a716-446655440000",
				expect.objectContaining({
					roleName: "Updated Software Engineer",
					location: "London",
				}),
			);
		});

		it("should return 404 when job role not found", async () => {
			mockUpdateJobRole.mockResolvedValue(null);

			await controller.updateJobRole(
				mockRequest as Request<JobRoleParams>,
				mockResponse as Response,
			);

			expect(mockResponse.status).toHaveBeenCalledWith(404);
			expect(mockResponse.json).toHaveBeenCalledWith({
				error: "Job role not found",
			});
		});

		it("should return 400 when no fields provided", async () => {
			mockRequest.body = {};

			await controller.updateJobRole(
				mockRequest as Request<JobRoleParams>,
				mockResponse as Response,
			);

			expect(mockResponse.status).toHaveBeenCalledWith(400);
			expect(mockResponse.json).toHaveBeenCalledWith({
				error: "No fields to update",
			});
		});

		it("should return 400 when role name is empty", async () => {
			mockRequest.body = { roleName: "" };

			await controller.updateJobRole(
				mockRequest as Request<JobRoleParams>,
				mockResponse as Response,
			);

			expect(mockResponse.status).toHaveBeenCalledWith(400);
			expect(mockResponse.json).toHaveBeenCalledWith({
				error: "Role name cannot be empty",
			});
		});

		it("should return 400 when description is empty", async () => {
			mockRequest.body = { description: "   " };

			await controller.updateJobRole(
				mockRequest as Request<JobRoleParams>,
				mockResponse as Response,
			);

			expect(mockResponse.status).toHaveBeenCalledWith(400);
			expect(mockResponse.json).toHaveBeenCalledWith({
				error: "Job spec summary cannot be empty",
			});
		});

		it("should return 400 when SharePoint URL is invalid", async () => {
			mockRequest.body = { sharepointUrl: "not-a-valid-url" };

			await controller.updateJobRole(
				mockRequest as Request<JobRoleParams>,
				mockResponse as Response,
			);

			expect(mockResponse.status).toHaveBeenCalledWith(400);
			expect(mockResponse.json).toHaveBeenCalledWith({
				error: "Invalid SharePoint URL format",
			});
		});

		it("should return 400 when SharePoint URL has invalid protocol", async () => {
			mockRequest.body = { sharepointUrl: "ftp://invalid.com" };

			await controller.updateJobRole(
				mockRequest as Request<JobRoleParams>,
				mockResponse as Response,
			);

			expect(mockResponse.status).toHaveBeenCalledWith(400);
			expect(mockResponse.json).toHaveBeenCalledWith({
				error: "Invalid SharePoint URL format",
			});
		});

		it("should return 400 when numberOfOpenPositions is less than 1", async () => {
			mockRequest.body = { numberOfOpenPositions: 0 };

			await controller.updateJobRole(
				mockRequest as Request<JobRoleParams>,
				mockResponse as Response,
			);

			expect(mockResponse.status).toHaveBeenCalledWith(400);
			expect(mockResponse.json).toHaveBeenCalledWith({
				error: "Number of open positions must be at least 1",
			});
		});

		it("should return 400 when closing date is in the past", async () => {
			mockRequest.body = { closingDate: "2025-01-01" };

			await controller.updateJobRole(
				mockRequest as Request<JobRoleParams>,
				mockResponse as Response,
			);

			expect(mockResponse.status).toHaveBeenCalledWith(400);
			expect(mockResponse.json).toHaveBeenCalledWith({
				error: "Closing date must be in the future",
			});
		});

		it("should return 400 when closing date is invalid", async () => {
			mockRequest.body = { closingDate: "not-a-date" };

			await controller.updateJobRole(
				mockRequest as Request<JobRoleParams>,
				mockResponse as Response,
			);

			expect(mockResponse.status).toHaveBeenCalledWith(400);
			expect(mockResponse.json).toHaveBeenCalledWith({
				error: "Invalid closing date format",
			});
		});

		it("should return 400 when service throws foreign key constraint error", async () => {
			const error = new Error("Foreign key constraint failed");
			mockUpdateJobRole.mockRejectedValue(error);

			await controller.updateJobRole(
				mockRequest as Request<JobRoleParams>,
				mockResponse as Response,
			);

			expect(mockResponse.status).toHaveBeenCalledWith(400);
			expect(mockResponse.json).toHaveBeenCalledWith({
				error: "Invalid capability, band, or status selected",
			});
		});

		it("should return 500 when service throws unexpected error", async () => {
			const error = new Error("Unexpected error");
			mockUpdateJobRole.mockRejectedValue(error);

			await controller.updateJobRole(
				mockRequest as Request<JobRoleParams>,
				mockResponse as Response,
			);

			expect(mockResponse.status).toHaveBeenCalledWith(500);
			expect(mockResponse.json).toHaveBeenCalledWith({
				error: "Internal server error",
			});
		});

		it("should return 400 when responsibilities is empty", async () => {
			mockRequest.body = { responsibilities: "   " };

			await controller.updateJobRole(
				mockRequest as Request<JobRoleParams>,
				mockResponse as Response,
			);

			expect(mockResponse.status).toHaveBeenCalledWith(400);
			expect(mockResponse.json).toHaveBeenCalledWith({
				error: "Responsibilities cannot be empty",
			});
		});

		it("should return 400 when location is empty", async () => {
			mockRequest.body = { location: "" };

			await controller.updateJobRole(
				mockRequest as Request<JobRoleParams>,
				mockResponse as Response,
			);

			expect(mockResponse.status).toHaveBeenCalledWith(400);
			expect(mockResponse.json).toHaveBeenCalledWith({
				error: "Location cannot be empty",
			});
		});

		it("should return 400 when sharepoint URL is empty", async () => {
			mockRequest.body = { sharepointUrl: "" };

			await controller.updateJobRole(
				mockRequest as Request<JobRoleParams>,
				mockResponse as Response,
			);

			expect(mockResponse.status).toHaveBeenCalledWith(400);
			expect(mockResponse.json).toHaveBeenCalledWith({
				error: "SharePoint link cannot be empty",
			});
		});

		it("should return 400 when capabilityId is empty", async () => {
			mockRequest.body = { capabilityId: "" };

			await controller.updateJobRole(
				mockRequest as Request<JobRoleParams>,
				mockResponse as Response,
			);

			expect(mockResponse.status).toHaveBeenCalledWith(400);
			expect(mockResponse.json).toHaveBeenCalledWith({
				error: "Capability cannot be empty",
			});
		});

		it("should return 400 when bandId is empty", async () => {
			mockRequest.body = { bandId: "" };

			await controller.updateJobRole(
				mockRequest as Request<JobRoleParams>,
				mockResponse as Response,
			);

			expect(mockResponse.status).toHaveBeenCalledWith(400);
			expect(mockResponse.json).toHaveBeenCalledWith({
				error: "Band cannot be empty",
			});
		});

		it("should return 400 when statusId is empty", async () => {
			mockRequest.body = { statusId: "" };

			await controller.updateJobRole(
				mockRequest as Request<JobRoleParams>,
				mockResponse as Response,
			);

			expect(mockResponse.status).toHaveBeenCalledWith(400);
			expect(mockResponse.json).toHaveBeenCalledWith({
				error: "Status cannot be empty",
			});
		});
	});

	describe("deleteJobRole", () => {
		it("should return 204 No Content when deletion succeeds", async () => {
			// Arrange
			mockRequest.params = { id: "550e8400-e29b-41d4-a716-446655440000" };
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
			await controller.deleteJobRole(
				mockRequest as Request<JobRoleParams>,
				mockResponse as Response,
			);

			// Assert
			expect(mockDeleteJobRole).toHaveBeenCalledOnce();
			expect(mockDeleteJobRole).toHaveBeenCalledWith(
				"550e8400-e29b-41d4-a716-446655440000",
			);
			expect(mockResponse.status).toHaveBeenCalledWith(204);
			expect(mockResponse.send).toHaveBeenCalledOnce();
		});

		it("should return 404 when job role not found", async () => {
			// Arrange
			mockRequest.params = { id: "non-existent-id" };
			mockDeleteJobRole.mockResolvedValue(null);

			// Act
			await controller.deleteJobRole(
				mockRequest as Request<JobRoleParams>,
				mockResponse as Response,
			);

			// Assert
			expect(mockResponse.status).toHaveBeenCalledWith(404);
			expect(mockResponse.json).toHaveBeenCalledWith({
				error: "Job role not found",
			});
		});

		it("should extract ID from request params correctly", async () => {
			// Arrange
			const testId = "test-id-12345";
			mockRequest.params = { id: testId };
			mockDeleteJobRole.mockResolvedValue({});

			// Act
			await controller.deleteJobRole(
				mockRequest as Request<JobRoleParams>,
				mockResponse as Response,
			);

			// Assert
			expect(mockDeleteJobRole).toHaveBeenCalledWith(testId);
		});

		it("should return 500 when service throws an error", async () => {
			// Arrange
			mockRequest.params = { id: "550e8400-e29b-41d4-a716-446655440000" };
			const error = new Error("Database error");
			mockDeleteJobRole.mockRejectedValue(error);

			// Act
			await controller.deleteJobRole(
				mockRequest as Request<JobRoleParams>,
				mockResponse as Response,
			);

			// Assert
			expect(mockResponse.status).toHaveBeenCalledWith(500);
			expect(mockResponse.json).toHaveBeenCalledWith({
				error: "Internal server error",
			});
		});
	});
});

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
		mockGetAllCapabilities = vi.fn();
		mockGetAllBands = vi.fn();
		mockCreateJobRole = vi.fn();

		// Mock the Service class
		JobRoleService.prototype.getOpenJobRoles = mockGetOpenJobRoles;
		JobRoleService.prototype.getJobRoleById = mockGetJobRoleById;
		JobRoleService.prototype.getAllCapabilities = mockGetAllCapabilities;
		JobRoleService.prototype.getAllBands = mockGetAllBands;
		JobRoleService.prototype.createJobRole = mockCreateJobRole;

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
					       errors: [
						       "Role name is required",
						       "Job spec summary is required",
						       "SharePoint link is required",
						       "Responsibilities are required",
						       "Number of open positions must be at least 1",
						       "Location is required",
						       "Closing date is required",
						       "Capability is required",
						       "Band is required",
					       ],
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
				       errors: ["Invalid SharePoint URL format"],
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
				       errors: ["Closing date must be in the future"],
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
				       errors: ["Number of open positions must be at least 1"],
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
});

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { Request, Response } from "express";
import { ApplicationController } from "../../src/controllers/application.controller.js";
import { ApplicationService } from "../../src/services/application.service.js";

vi.mock("../../src/services/application.service.js");

function createMockFile(overrides?: Partial<Express.Multer.File>): Express.Multer.File {
	return {
		fieldname: "CV",
		originalname: "resume.pdf",
		encoding: "7bit",
		mimetype: "application/pdf",
		buffer: Buffer.from("PDF content"),
		size: 1024,
		destination: "",
		filename: "resume.pdf",
		path: "",
		stream: null as any,
		...overrides,
	};
}

describe("ApplicationController", () => {
	let controller: ApplicationController;
	let mockRequest: Partial<Request>;
	let mockResponse: Partial<Response>;
	let consoleErrorSpy: any;

	const mockS3Url =
		"https://bucket.s3.us-east-1.amazonaws.com/applications/temp-123456/1739723400000_resume.pdf";

	const mockApplication = {
		applicationId: "app-123",
		userId: "user-123",
		jobRoleId: "role-123",
		status: "applied",
		appliedAt: new Date("2026-02-16"),
		cvUrl: mockS3Url,
	};

	const mockApplications = [
		mockApplication,
		{
			applicationId: "app-456",
			userId: "user-456",
			jobRoleId: "role-456",
			status: "accepted",
			appliedAt: new Date("2026-02-15"),
			cvUrl: mockS3Url,
		},
	];

	beforeEach(() => {
		mockRequest = {
			body: {},
			params: {},
		};
		mockResponse = {
			status: vi.fn().mockReturnThis(),
			json: vi.fn().mockReturnThis(),
			send: vi.fn().mockReturnThis(),
		};

		consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

		controller = new ApplicationController();
	});

	afterEach(() => {
		consoleErrorSpy.mockRestore();
		vi.clearAllMocks();
	});

	describe("getApplications", () => {
		it("should return 200 status with all applications", async () => {
			const mockGetApplications = vi
				.spyOn(ApplicationService.prototype, "getApplications")
				.mockResolvedValue(mockApplications);

			await controller.getApplications(
				mockRequest as Request,
				mockResponse as Response,
			);

			expect(mockResponse.status).toHaveBeenCalledWith(200);
			expect(mockResponse.json).toHaveBeenCalledWith(mockApplications);
			mockGetApplications.mockRestore();
		});

		it("should return 500 status on service error", async () => {
			const mockError = new Error("Database error");
			const mockGetApplications = vi
				.spyOn(ApplicationService.prototype, "getApplications")
				.mockRejectedValue(mockError);

			await controller.getApplications(
				mockRequest as Request,
				mockResponse as Response,
			);

			expect(mockResponse.status).toHaveBeenCalledWith(500);
			expect(mockResponse.send).toHaveBeenCalled();
			expect(consoleErrorSpy).toHaveBeenCalled();
			mockGetApplications.mockRestore();
		});
	});

	describe("getApplicationById", () => {
		it("should return 200 status with application when ID is valid", async () => {
			mockRequest.params = { id: "app-123" };
			const mockGetApplicationById = vi
				.spyOn(ApplicationService.prototype, "getApplicationById")
				.mockResolvedValue(mockApplication);

			await controller.getApplicationById(
				mockRequest as Request,
				mockResponse as Response,
			);

			expect(mockResponse.status).toHaveBeenCalledWith(200);
			expect(mockResponse.json).toHaveBeenCalledWith(mockApplication);
			mockGetApplicationById.mockRestore();
		});

		it("should return 404 status when application not found", async () => {
			mockRequest.params = { id: "app-nonexistent" };
			const mockGetApplicationById = vi
				.spyOn(ApplicationService.prototype, "getApplicationById")
				.mockResolvedValue(null);

			await controller.getApplicationById(
				mockRequest as Request,
				mockResponse as Response,
			);

			expect(mockResponse.status).toHaveBeenCalledWith(404);
			expect(mockResponse.send).toHaveBeenCalled();
			mockGetApplicationById.mockRestore();
		});

		it("should return 400 status when ID is missing", async () => {
			mockRequest.params = {};

			await controller.getApplicationById(
				mockRequest as Request,
				mockResponse as Response,
			);

			expect(mockResponse.status).toHaveBeenCalledWith(400);
			expect(mockResponse.json).toHaveBeenCalledWith({
				error: "Application ID format incorrect. Need String.",
			});
		});

		it("should return 400 status when ID is empty string", async () => {
			mockRequest.params = { id: "   " };

			await controller.getApplicationById(
				mockRequest as Request,
				mockResponse as Response,
			);

			expect(mockResponse.status).toHaveBeenCalledWith(400);
		});

		it("should return 500 status on service error", async () => {
			mockRequest.params = { id: "app-123" };
			const mockError = new Error("Database error");
			const mockGetApplicationById = vi
				.spyOn(ApplicationService.prototype, "getApplicationById")
				.mockRejectedValue(mockError);

			await controller.getApplicationById(
				mockRequest as Request,
				mockResponse as Response,
			);

			expect(mockResponse.status).toHaveBeenCalledWith(500);
			expect(consoleErrorSpy).toHaveBeenCalled();
			mockGetApplicationById.mockRestore();
		});
	});

	describe("createApplication", () => {
		it("should return 400 status when file is missing", async () => {
			mockRequest.body = {
				userId: "user-123",
				jobRoleId: "role-123",
			};
			mockRequest.file = undefined;

			await controller.createApplication(
				mockRequest as Request,
				mockResponse as Response,
			);

			expect(mockResponse.status).toHaveBeenCalledWith(400);
			expect(mockResponse.json).toHaveBeenCalledWith({
				error: "CV file is required",
			});
		});

		it("should return 201 status with created application when file is provided", async () => {
			const mockFile = createMockFile();
			mockRequest.body = {
				userId: "user-123",
				jobRoleId: "role-123",
			};
			mockRequest.file = mockFile;
			const mockCreateApplication = vi
				.spyOn(ApplicationService.prototype, "createApplication")
				.mockResolvedValue(mockApplication);

			await controller.createApplication(
				mockRequest as Request,
				mockResponse as Response,
			);

			expect(mockResponse.status).toHaveBeenCalledWith(201);
			expect(mockResponse.json).toHaveBeenCalledWith(mockApplication);
			expect(mockCreateApplication).toHaveBeenCalledWith(
				mockRequest.body,
				mockFile,
			);
			mockCreateApplication.mockRestore();
		});

		it("should call service with correct application data and file", async () => {
			const mockFile = createMockFile({ originalname: "custom_resume.pdf" });
			const applicationData = {
				userId: "user-456",
				jobRoleId: "role-456",
			};
			mockRequest.body = applicationData;
			mockRequest.file = mockFile;
			const mockCreateApplication = vi
				.spyOn(ApplicationService.prototype, "createApplication")
				.mockResolvedValue(mockApplications[1]);

			await controller.createApplication(
				mockRequest as Request,
				mockResponse as Response,
			);

			expect(mockCreateApplication).toHaveBeenCalledWith(
				applicationData,
				mockFile,
			);
			mockCreateApplication.mockRestore();
		});

		it("should handle different file types", async () => {
			const docxFile = createMockFile({
				originalname: "resume.docx",
				mimetype:
					"application/vnd.openxmlformats-officedocument.wordprocessingml.document",
			});
			mockRequest.body = {
				userId: "user-123",
				jobRoleId: "role-123",
			};
			mockRequest.file = docxFile;
			const mockCreateApplication = vi
				.spyOn(ApplicationService.prototype, "createApplication")
				.mockResolvedValue(mockApplication);

			await controller.createApplication(
				mockRequest as Request,
				mockResponse as Response,
			);

			expect(mockCreateApplication).toHaveBeenCalledWith(
				mockRequest.body,
				docxFile,
			);
			expect(mockResponse.status).toHaveBeenCalledWith(201);
			mockCreateApplication.mockRestore();
		});

		it("should return 500 status on service error with error message", async () => {
			const mockFile = createMockFile();
			const mockError = new Error("S3 upload failed");
			mockRequest.body = {
				userId: "user-123",
				jobRoleId: "role-123",
			};
			mockRequest.file = mockFile;
			const mockCreateApplication = vi
				.spyOn(ApplicationService.prototype, "createApplication")
				.mockRejectedValue(mockError);

			await controller.createApplication(
				mockRequest as Request,
				mockResponse as Response,
			);

			expect(mockResponse.status).toHaveBeenCalledWith(500);
			expect(mockResponse.json).toHaveBeenCalledWith({
				error: "S3 upload failed",
			});
			expect(consoleErrorSpy).toHaveBeenCalled();
			mockCreateApplication.mockRestore();
		});
	});

	describe("updateApplication", () => {
		it("should return 200 status with updated application", async () => {
			mockRequest.params = { id: "app-123" };
			mockRequest.body = { status: "accepted" };
			const updatedApplication = { ...mockApplication, status: "accepted" };
			const mockUpdateApplication = vi
				.spyOn(ApplicationService.prototype, "updateApplication")
				.mockResolvedValue(updatedApplication);

			await controller.updateApplication(
				mockRequest as Request,
				mockResponse as Response,
			);

			expect(mockResponse.status).toHaveBeenCalledWith(200);
			expect(mockResponse.json).toHaveBeenCalledWith(updatedApplication);
			mockUpdateApplication.mockRestore();
		});

		it("should return 400 status when ID is missing", async () => {
			mockRequest.params = {};
			mockRequest.body = { status: "accepted" };

			await controller.updateApplication(
				mockRequest as Request,
				mockResponse as Response,
			);

			expect(mockResponse.status).toHaveBeenCalledWith(400);
			expect(mockResponse.json).toHaveBeenCalledWith({
				error: "Application ID format incorrect. Need String.",
			});
		});

		it("should call service with correct parameters", async () => {
			mockRequest.params = { id: "app-123" };
			mockRequest.body = { cvUrl: "https://example.com/new-cv.pdf" };
			const updatedApplication = {
				...mockApplication,
				cvUrl: "https://example.com/new-cv.pdf",
			};
			const mockUpdateApplication = vi
				.spyOn(ApplicationService.prototype, "updateApplication")
				.mockResolvedValue(updatedApplication);

			await controller.updateApplication(
				mockRequest as Request,
				mockResponse as Response,
			);

			expect(mockUpdateApplication).toHaveBeenCalledWith(
				"app-123",
				mockRequest.body,
			);
			mockUpdateApplication.mockRestore();
		});

		it("should return 500 status on service error", async () => {
			mockRequest.params = { id: "app-123" };
			mockRequest.body = { status: "accepted" };
			const mockError = new Error("Database error");
			const mockUpdateApplication = vi
				.spyOn(ApplicationService.prototype, "updateApplication")
				.mockRejectedValue(mockError);

			await controller.updateApplication(
				mockRequest as Request,
				mockResponse as Response,
			);

			expect(mockResponse.status).toHaveBeenCalledWith(500);
			mockUpdateApplication.mockRestore();
		});
	});

	describe("deleteApplication", () => {
		it("should return 204 status on successful deletion", async () => {
			mockRequest.params = { id: "app-123" };
			const mockDeleteApplication = vi
				.spyOn(ApplicationService.prototype, "deleteApplication")
				.mockResolvedValue(mockApplication);

			await controller.deleteApplication(
				mockRequest as Request,
				mockResponse as Response,
			);

			expect(mockResponse.status).toHaveBeenCalledWith(204);
			expect(mockResponse.send).toHaveBeenCalled();
			mockDeleteApplication.mockRestore();
		});

		it("should return 400 status when ID is missing", async () => {
			mockRequest.params = {};

			await controller.deleteApplication(
				mockRequest as Request,
				mockResponse as Response,
			);

			expect(mockResponse.status).toHaveBeenCalledWith(400);
			expect(mockResponse.json).toHaveBeenCalledWith({
				error: "Application ID format incorrect. Need String.",
			});
		});

		it("should call service with correct ID", async () => {
			mockRequest.params = { id: "app-456" };
			const mockDeleteApplication = vi
				.spyOn(ApplicationService.prototype, "deleteApplication")
				.mockResolvedValue(mockApplications[1]);

			await controller.deleteApplication(
				mockRequest as Request,
				mockResponse as Response,
			);

			expect(mockDeleteApplication).toHaveBeenCalledWith("app-456");
			mockDeleteApplication.mockRestore();
		});

		it("should return 500 status on service error", async () => {
			mockRequest.params = { id: "app-123" };
			const mockError = new Error("Database error");
			const mockDeleteApplication = vi
				.spyOn(ApplicationService.prototype, "deleteApplication")
				.mockRejectedValue(mockError);

			await controller.deleteApplication(
				mockRequest as Request,
				mockResponse as Response,
			);

			expect(mockResponse.status).toHaveBeenCalledWith(500);
			mockDeleteApplication.mockRestore();
		});
	});

	describe("getApplicationsForUser", () => {
		it("should return 200 status with user applications", async () => {
			mockRequest.params = { userId: "user-123" };
			const userApplications = [mockApplication];
			const mockGetApplicationsForUser = vi
				.spyOn(ApplicationService.prototype, "getApplicationsForUser")
				.mockResolvedValue(userApplications);

			await controller.getApplicationsForUser(
				mockRequest as Request,
				mockResponse as Response,
			);

			expect(mockResponse.status).toHaveBeenCalledWith(200);
			expect(mockResponse.json).toHaveBeenCalledWith(userApplications);
			mockGetApplicationsForUser.mockRestore();
		});

		it("should return 400 status when userId is missing", async () => {
			mockRequest.params = {};

			await controller.getApplicationsForUser(
				mockRequest as Request,
				mockResponse as Response,
			);

			expect(mockResponse.status).toHaveBeenCalledWith(400);
			expect(mockResponse.json).toHaveBeenCalledWith({
				error: "User ID format incorrect. Need String.",
			});
		});

		it("should return empty array when user has no applications", async () => {
			mockRequest.params = { userId: "user-no-apps" };
			const mockGetApplicationsForUser = vi
				.spyOn(ApplicationService.prototype, "getApplicationsForUser")
				.mockResolvedValue([]);

			await controller.getApplicationsForUser(
				mockRequest as Request,
				mockResponse as Response,
			);

			expect(mockResponse.status).toHaveBeenCalledWith(200);
			expect(mockResponse.json).toHaveBeenCalledWith([]);
			mockGetApplicationsForUser.mockRestore();
		});

		it("should call service with correct userId", async () => {
			mockRequest.params = { userId: "user-789" };
			const mockGetApplicationsForUser = vi
				.spyOn(ApplicationService.prototype, "getApplicationsForUser")
				.mockResolvedValue([]);

			await controller.getApplicationsForUser(
				mockRequest as Request,
				mockResponse as Response,
			);

			expect(mockGetApplicationsForUser).toHaveBeenCalledWith("user-789");
			mockGetApplicationsForUser.mockRestore();
		});

		it("should return 500 status on service error", async () => {
			mockRequest.params = { userId: "user-123" };
			const mockError = new Error("Database error");
			const mockGetApplicationsForUser = vi
				.spyOn(ApplicationService.prototype, "getApplicationsForUser")
				.mockRejectedValue(mockError);

			await controller.getApplicationsForUser(
				mockRequest as Request,
				mockResponse as Response,
			);

			expect(mockResponse.status).toHaveBeenCalledWith(500);
			mockGetApplicationsForUser.mockRestore();
		});
	});
});

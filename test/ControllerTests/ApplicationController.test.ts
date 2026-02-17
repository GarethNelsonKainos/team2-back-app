import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { Request, Response } from "express";
import type { Prisma } from "../../src/generated/prisma/client.js";
import { ApplicationController } from "../../src/controllers/application.controller.js";
import { ApplicationService } from "../../src/services/application.service.js";

vi.mock("../../src/services/application.service.js");

function createMockFile(
	overrides?: Partial<Express.Multer.File>,
): Express.Multer.File {
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
			const applicationData: Prisma.ApplicationsUncheckedCreateInput = {
				userId: "user-123",
				jobRoleId: "role-123",
			};
			mockRequest.body = applicationData;
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

		it("should return 500 status on service error without error message", async () => {
			const mockFile = createMockFile();
			const mockError = new Error("S3 upload failed");
			const applicationData: Prisma.ApplicationsUncheckedCreateInput = {
				userId: "user-123",
				jobRoleId: "role-123",
			};
			mockRequest.body = applicationData;
			mockRequest.file = mockFile;
			const mockCreateApplication = vi
				.spyOn(ApplicationService.prototype, "createApplication")
				.mockRejectedValue(mockError);

			await controller.createApplication(
				mockRequest as Request,
				mockResponse as Response,
			);

			expect(mockResponse.status).toHaveBeenCalledWith(500);
			expect(mockResponse.send).toHaveBeenCalledWith();
			expect(mockResponse.json).not.toHaveBeenCalled();
			expect(consoleErrorSpy).toHaveBeenCalled();
			mockCreateApplication.mockRestore();
		});
	});
});

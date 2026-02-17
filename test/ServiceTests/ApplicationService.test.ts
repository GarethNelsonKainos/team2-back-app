import { describe, it, expect, vi, beforeEach } from "vitest";
import { ApplicationService } from "../../src/services/application.service.js";
import { ApplicationDao } from "../../src/daos/application.dao.js";
import { S3Service } from "../../src/services/s3.service.js";
import type { Prisma } from "../../src/generated/prisma/client.js";

vi.mock("../../src/daos/application.dao.js");
vi.mock("../../src/services/s3.service.js");

describe("ApplicationService", () => {
	let service: ApplicationService;
	let mockCreateApplication: any;
	let mockGenerateFileKey: any;
	let mockUploadFile: any;

	const mockFile = {
		fieldname: "CV",
		originalname: "resume.pdf",
		encoding: "7bit",
		mimetype: "application/pdf",
		buffer: Buffer.from("PDF content here"),
		size: 1024,
	} as Express.Multer.File;

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
		mockCreateApplication = vi.fn();
		mockGenerateFileKey = vi
			.fn()
			.mockReturnValue("applications/temp-123456/1739723400000_resume.pdf");
		mockUploadFile = vi.fn().mockResolvedValue(mockS3Url);

		ApplicationDao.prototype.createApplication = mockCreateApplication;
		S3Service.prototype.generateFileKey = mockGenerateFileKey;
		S3Service.prototype.uploadFile = mockUploadFile;

		service = new ApplicationService();
	});

	describe("createApplication", () => {
		it("should create and return new application with file upload", async () => {
			const applicationData: Prisma.ApplicationsUncheckedCreateInput = {
				userId: "user-123",
				jobRoleId: "role-123",
			};
			mockCreateApplication.mockResolvedValue(mockApplication);

			const result = await service.createApplication(applicationData, mockFile);

			expect(result).toEqual(mockApplication);
			expect(mockGenerateFileKey).toHaveBeenCalledWith("resume.pdf");
			expect(mockUploadFile).toHaveBeenCalledWith(
				mockFile,
				"applications/temp-123456/1739723400000_resume.pdf",
			);
			expect(mockCreateApplication).toHaveBeenCalledWith({
				...applicationData,
				cvUrl: mockS3Url,
			});
		});

		it("should propagate S3 upload errors", async () => {
			const error = new Error("S3 upload failed");
			mockUploadFile.mockRejectedValue(error);

			const applicationData: Prisma.ApplicationsUncheckedCreateInput = {
				userId: "user-123",
				jobRoleId: "role-123",
			};

			await expect(
				service.createApplication(applicationData, mockFile),
			).rejects.toThrow("S3 upload failed");
		});

		it("should propagate DAO creation errors", async () => {
			const error = new Error("Database validation error");
			mockCreateApplication.mockRejectedValue(error);

			const applicationData: Prisma.ApplicationsUncheckedCreateInput = {
				userId: "user-123",
				jobRoleId: "role-123",
			};

			await expect(
				service.createApplication(applicationData, mockFile),
			).rejects.toThrow("Database validation error");
		});
	});
});

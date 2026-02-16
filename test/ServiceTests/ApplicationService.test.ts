import { describe, it, expect, vi, beforeEach } from "vitest";
import { ApplicationService } from "../../src/services/application.service.js";
import { ApplicationDao } from "../../src/daos/application.dao.js";
import { S3Service } from "../../src/services/s3.service.js";

vi.mock("../../src/daos/application.dao.js");
vi.mock("../../src/services/s3.service.js");

describe("ApplicationService", () => {
	let service: ApplicationService;
	let mockGetApplications: any;
	let mockGetApplicationById: any;
	let mockGetApplicationsForUser: any;
	let mockCreateApplication: any;
	let mockUpdateApplication: any;
	let mockDeleteApplication: any;
	let mockGenerateFileKey: any;
	let mockUploadFile: any;

	// Mock file object
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
		mockGetApplications = vi.fn().mockResolvedValue(mockApplications);
		mockGetApplicationById = vi.fn();
		mockGetApplicationsForUser = vi.fn();
		mockCreateApplication = vi.fn();
		mockUpdateApplication = vi.fn();
		mockDeleteApplication = vi.fn();
		mockGenerateFileKey = vi
			.fn()
			.mockReturnValue("applications/temp-123456/1739723400000_resume.pdf");
		mockUploadFile = vi.fn().mockResolvedValue(mockS3Url);

		ApplicationDao.prototype.getAllApplications = mockGetApplications;
		ApplicationDao.prototype.getApplicationById = mockGetApplicationById;
		ApplicationDao.prototype.getAllApplicationsForUser =
			mockGetApplicationsForUser;
		ApplicationDao.prototype.createApplication = mockCreateApplication;
		ApplicationDao.prototype.updateApplication = mockUpdateApplication;
		ApplicationDao.prototype.deleteApplication = mockDeleteApplication;

		S3Service.prototype.generateFileKey = mockGenerateFileKey;
		S3Service.prototype.uploadFile = mockUploadFile;

		service = new ApplicationService();
	});

	describe("getApplications", () => {
		it("should return all applications", async () => {
			mockGetApplications.mockResolvedValue(mockApplications);

			const result = await service.getApplications();

			expect(result).toHaveLength(2);
			expect(result).toEqual(mockApplications);
		});

		it("should call DAO getAllApplications method", async () => {
			mockGetApplications.mockResolvedValue(mockApplications);

			await service.getApplications();

			expect(mockGetApplications).toHaveBeenCalledTimes(1);
		});

		it("should return empty array when no applications exist", async () => {
			mockGetApplications.mockResolvedValue([]);

			const result = await service.getApplications();

			expect(result).toEqual([]);
			expect(result).toHaveLength(0);
		});

		it("should propagate errors from DAO", async () => {
			const error = new Error("Database error");
			mockGetApplications.mockRejectedValue(error);

			await expect(service.getApplications()).rejects.toThrow("Database error");
		});
	});

	describe("getApplicationById", () => {
		it("should return application when found", async () => {
			mockGetApplicationById.mockResolvedValue(mockApplication);

			const result = await service.getApplicationById("app-123");

			expect(result).toEqual(mockApplication);
			expect(mockGetApplicationById).toHaveBeenCalledWith("app-123");
			expect(mockGetApplicationById).toHaveBeenCalledTimes(1);
		});

		it("should return null when application not found", async () => {
			mockGetApplicationById.mockResolvedValue(null);

			const result = await service.getApplicationById("non-existent");

			expect(result).toBeNull();
			expect(mockGetApplicationById).toHaveBeenCalledWith("non-existent");
		});

		it("should call DAO getApplicationById with correct id", async () => {
			const testId = "app-test-id";
			mockGetApplicationById.mockResolvedValue(null);

			await service.getApplicationById(testId);

			expect(mockGetApplicationById).toHaveBeenCalledWith(testId);
		});

		it("should propagate errors from DAO", async () => {
			const error = new Error("Database error");
			mockGetApplicationById.mockRejectedValue(error);

			await expect(service.getApplicationById("app-123")).rejects.toThrow(
				"Database error",
			);
		});
	});

	describe("getApplicationsForUser", () => {
		it("should return applications for specific user", async () => {
			const userApplications = [mockApplication];
			mockGetApplicationsForUser.mockResolvedValue(userApplications);

			const result = await service.getApplicationsForUser("user-123");

			expect(result).toHaveLength(1);
			expect(result[0].userId).toBe("user-123");
			expect(mockGetApplicationsForUser).toHaveBeenCalledWith("user-123");
		});

		it("should return empty array when user has no applications", async () => {
			mockGetApplicationsForUser.mockResolvedValue([]);

			const result = await service.getApplicationsForUser("user-no-apps");

			expect(result).toEqual([]);
			expect(result).toHaveLength(0);
		});

		it("should call DAO getAllApplicationsForUser with correct userId", async () => {
			const testUserId = "user-test-id";
			mockGetApplicationsForUser.mockResolvedValue([]);

			await service.getApplicationsForUser(testUserId);

			expect(mockGetApplicationsForUser).toHaveBeenCalledWith(testUserId);
			expect(mockGetApplicationsForUser).toHaveBeenCalledTimes(1);
		});

		it("should propagate errors from DAO", async () => {
			const error = new Error("Database error");
			mockGetApplicationsForUser.mockRejectedValue(error);

			await expect(service.getApplicationsForUser("user-123")).rejects.toThrow(
				"Database error",
			);
		});
	});

	describe("createApplication", () => {
		it("should create and return new application with file upload", async () => {
			const applicationData = {
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

		it("should handle different file types", async () => {
			const docFile = {
				fieldname: "CV",
				originalname: "resume.docx",
				encoding: "7bit",
				mimetype:
					"application/vnd.openxmlformats-officedocument.wordprocessingml.document",
				buffer: Buffer.from("DOCX content"),
				size: 512,
			}as Express.Multer.File;

			const applicationData = {
				userId: "user-456",
				jobRoleId: "role-456",
			};
			mockCreateApplication.mockResolvedValue({
				...mockApplication,
				applicationId: "app-456",
			});

			await service.createApplication(applicationData, docFile);

			expect(mockGenerateFileKey).toHaveBeenCalledWith("resume.docx");
			expect(mockUploadFile).toHaveBeenCalledWith(
				docFile,
				"applications/temp-123456/1739723400000_resume.pdf",
			);
		});

		it("should propagate S3 upload errors", async () => {
			const error = new Error("S3 upload failed");
			mockUploadFile.mockRejectedValue(error);

			const applicationData = {
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

			const applicationData = {
				userId: "user-123",
				jobRoleId: "role-123",
			};

			await expect(
				service.createApplication(applicationData, mockFile),
			).rejects.toThrow("Database validation error");
		});

		it("should include S3 URL in application data passed to DAO", async () => {
			const applicationData = {
				userId: "user-789",
				jobRoleId: "role-789",
			};
			mockCreateApplication.mockResolvedValue({
				...mockApplication,
				userId: "user-789",
				jobRoleId: "role-789",
			});

			await service.createApplication(applicationData, mockFile);

			expect(mockCreateApplication).toHaveBeenCalledWith({
				userId: "user-789",
				jobRoleId: "role-789",
				cvUrl: mockS3Url,
			});
		});
	});

	describe("updateApplication", () => {
		it("should update and return modified application", async () => {
			const updateData = { status: "accepted" };
			const updatedApplication = { ...mockApplication, status: "accepted" };
			mockUpdateApplication.mockResolvedValue(updatedApplication);

			const result = await service.updateApplication("app-123", updateData);

			expect(result).toEqual(updatedApplication);
			expect(result.status).toBe("accepted");
			expect(mockUpdateApplication).toHaveBeenCalledWith("app-123", updateData);
		});

		it("should call DAO updateApplication with correct id and data", async () => {
			const updateData = { cvUrl: "https://example.com/new-cv.pdf" };
			mockUpdateApplication.mockResolvedValue(mockApplication);

			await service.updateApplication("app-123", updateData);

			expect(mockUpdateApplication).toHaveBeenCalledWith("app-123", updateData);
			expect(mockUpdateApplication).toHaveBeenCalledTimes(1);
		});

		it("should propagate errors from DAO", async () => {
			const error = new Error("Record not found");
			mockUpdateApplication.mockRejectedValue(error);

			const updateData = { status: "rejected" };

			await expect(
				service.updateApplication("app-123", updateData),
			).rejects.toThrow("Record not found");
		});
	});

	describe("deleteApplication", () => {
		it("should delete and return deleted application", async () => {
			mockDeleteApplication.mockResolvedValue(mockApplication);

			const result = await service.deleteApplication("app-123");

			expect(result).toEqual(mockApplication);
			expect(mockDeleteApplication).toHaveBeenCalledWith("app-123");
			expect(mockDeleteApplication).toHaveBeenCalledTimes(1);
		});

		it("should call DAO deleteApplication with correct id", async () => {
			const testId = "app-456";
			mockDeleteApplication.mockResolvedValue(mockApplications[1]);

			await service.deleteApplication(testId);

			expect(mockDeleteApplication).toHaveBeenCalledWith(testId);
		});

		it("should propagate errors from DAO", async () => {
			const error = new Error("Record not found");
			mockDeleteApplication.mockRejectedValue(error);

			await expect(service.deleteApplication("app-123")).rejects.toThrow(
				"Record not found",
			);
		});
	});
});

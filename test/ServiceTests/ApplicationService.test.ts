import { describe, it, expect, vi, beforeEach, afterEach, Mock } from "vitest";
import { ApplicationService } from "../../src/services/application.service.js";
import { ApplicationDao } from "../../src/daos/application.dao.js";
import { S3Service } from "../../src/services/s3.service.js";
import { ApplicationStatus } from "../../src/types/CreateApplication.js";

// Mock the dependencies
vi.mock("../../src/daos/application.dao.js");
vi.mock("../../src/services/s3.service.js");

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

describe("ApplicationService", () => {
	let applicationService: ApplicationService;
	let mockApplicationDao: ApplicationDao;
	let mockS3Service: S3Service;
	let mockGenerateFileKey: Mock;
	let mockUploadFile: Mock;
	let mockCreateApplication: Mock;

	beforeEach(() => {
		mockGenerateFileKey = vi.fn();
		mockUploadFile = vi.fn();
		mockCreateApplication = vi.fn();

		mockS3Service = {
			generateFileKey: mockGenerateFileKey,
			uploadFile: mockUploadFile,
		} as unknown as S3Service;

		mockApplicationDao = {
			createApplication: mockCreateApplication,
		} as unknown as ApplicationDao;

		applicationService = new ApplicationService(
			mockApplicationDao,
			mockS3Service,
		);
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	describe("createApplication", () => {
		it("should create application successfully with correct data flow", async () => {
			const mockFile = createMockFile();
			const applicationData = {
				userId: "user-id-123",
				jobRoleId: "job-role-id-456",
			};

			mockGenerateFileKey.mockReturnValue("uploads/resume-123.pdf");
			mockUploadFile.mockResolvedValue(
				"https://s3.amazonaws.com/bucket/uploads/resume-123.pdf",
			);
			mockCreateApplication.mockResolvedValue(undefined);

			await applicationService.createApplication(applicationData, mockFile);

			expect(mockGenerateFileKey).toHaveBeenCalledWith(
				"resume.pdf",
				"user-id-123",
			);
			expect(mockUploadFile).toHaveBeenCalledWith(
				mockFile,
				"uploads/resume-123.pdf",
			);
			expect(mockCreateApplication).toHaveBeenCalledWith({
				userId: "user-id-123",
				jobRoleId: "job-role-id-456",
				cvUrl: "https://s3.amazonaws.com/bucket/uploads/resume-123.pdf",
				status: ApplicationStatus.IN_PROGRESS,
			});
		});

		it("should call generateFileKey with correct filename", async () => {
			const mockFile = createMockFile({ originalname: "my-cv.docx" });
			const applicationData = {
				userId: "user-id-123",
				jobRoleId: "job-role-id-456",
			};

			mockGenerateFileKey.mockReturnValue("uploads/my-cv-123.docx");
			mockUploadFile.mockResolvedValue(
				"https://s3.amazonaws.com/bucket/cv.docx",
			);
			mockCreateApplication.mockResolvedValue(undefined);

			await applicationService.createApplication(applicationData, mockFile);

			expect(mockGenerateFileKey).toHaveBeenCalledWith(
				"my-cv.docx",
				"user-id-123",
			);
		});

		it("should call uploadFile with file and generated key", async () => {
			const mockFile = createMockFile();
			const applicationData = {
				userId: "user-id-123",
				jobRoleId: "job-role-id-456",
			};

			const generatedKey = "uploads/file-key-xyz.pdf";
			mockGenerateFileKey.mockReturnValue(generatedKey);
			mockUploadFile.mockResolvedValue(
				"https://s3.amazonaws.com/bucket/cv.pdf",
			);
			mockCreateApplication.mockResolvedValue(undefined);

			await applicationService.createApplication(applicationData, mockFile);

			expect(mockUploadFile).toHaveBeenCalledWith(mockFile, generatedKey);
		});

		it("should set status to IN_PROGRESS", async () => {
			const mockFile = createMockFile();
			const applicationData = {
				userId: "user-id-123",
				jobRoleId: "job-role-id-456",
			};

			mockGenerateFileKey.mockReturnValue("uploads/resume-123.pdf");
			mockUploadFile.mockResolvedValue(
				"https://s3.amazonaws.com/bucket/cv.pdf",
			);
			mockCreateApplication.mockResolvedValue(undefined);

			await applicationService.createApplication(applicationData, mockFile);

			expect(mockCreateApplication).toHaveBeenCalledWith(
				expect.objectContaining({
					status: ApplicationStatus.IN_PROGRESS,
				}),
			);
		});

		it("should include cvUrl from S3 upload in application data", async () => {
			const mockFile = createMockFile();
			const applicationData = {
				userId: "user-id-123",
				jobRoleId: "job-role-id-456",
			};

			const s3Url = "https://s3.amazonaws.com/bucket/uploads/cv-xyz.pdf";
			mockGenerateFileKey.mockReturnValue("uploads/cv-xyz.pdf");
			mockUploadFile.mockResolvedValue(s3Url);
			mockCreateApplication.mockResolvedValue(undefined);

			await applicationService.createApplication(applicationData, mockFile);

			expect(mockCreateApplication).toHaveBeenCalledWith(
				expect.objectContaining({
					cvUrl: s3Url,
				}),
			);
		});

		it("should throw error when S3 upload fails", async () => {
			const mockFile = createMockFile();
			const applicationData = {
				userId: "user-id-123",
				jobRoleId: "job-role-id-456",
			};

			const uploadError = new Error("S3 upload failed");
			mockGenerateFileKey.mockReturnValue("uploads/resume-123.pdf");
			mockUploadFile.mockRejectedValue(uploadError);

			await expect(
				applicationService.createApplication(applicationData, mockFile),
			).rejects.toThrow("S3 upload failed");

			expect(mockCreateApplication).not.toHaveBeenCalled();
		});

		it("should throw error when DAO createApplication fails", async () => {
			const mockFile = createMockFile();
			const applicationData = {
				userId: "user-id-123",
				jobRoleId: "job-role-id-456",
			};

			const daoError = new Error("Database error");
			mockGenerateFileKey.mockReturnValue("uploads/resume-123.pdf");
			mockUploadFile.mockResolvedValue(
				"https://s3.amazonaws.com/bucket/cv.pdf",
			);
			mockCreateApplication.mockRejectedValue(daoError);

			await expect(
				applicationService.createApplication(applicationData, mockFile),
			).rejects.toThrow("Database error");

			expect(mockGenerateFileKey).toHaveBeenCalled();
			expect(mockUploadFile).toHaveBeenCalled();
			expect(mockCreateApplication).toHaveBeenCalled();
		});

		it("should preserve all fields from applicationData", async () => {
			const mockFile = createMockFile();
			const applicationData = {
				userId: "specific-user-id",
				jobRoleId: "specific-job-role-id",
			};

			mockGenerateFileKey.mockReturnValue("uploads/resume-123.pdf");
			mockUploadFile.mockResolvedValue(
				"https://s3.amazonaws.com/bucket/cv.pdf",
			);
			mockCreateApplication.mockResolvedValue(undefined);

			await applicationService.createApplication(applicationData, mockFile);

			expect(mockCreateApplication).toHaveBeenCalledWith({
				userId: "specific-user-id",
				jobRoleId: "specific-job-role-id",
				cvUrl: "https://s3.amazonaws.com/bucket/cv.pdf",
				status: ApplicationStatus.IN_PROGRESS,
			});
		});

		it("should call methods in correct order", async () => {
			const mockFile = createMockFile();
			const applicationData = {
				userId: "user-id-123",
				jobRoleId: "job-role-id-456",
			};

			const callOrder: string[] = [];

			mockGenerateFileKey.mockImplementation(() => {
				callOrder.push("generateFileKey");
				return "uploads/resume-123.pdf";
			});

			mockUploadFile.mockImplementation(async () => {
				callOrder.push("uploadFile");
				return "https://s3.amazonaws.com/bucket/cv.pdf";
			});

			mockCreateApplication.mockImplementation(async () => {
				callOrder.push("createApplication");
			});

			await applicationService.createApplication(applicationData, mockFile);

			expect(callOrder).toEqual([
				"generateFileKey",
				"uploadFile",
				"createApplication",
			]);
		});
	});
});

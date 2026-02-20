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
			getApplicationsForUser: vi.fn(),
			getApplicationsByJobRoleId: vi.fn(),
			updateApplicationStatus: vi.fn(),
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

	describe("getApplicationsForUser", () => {
		it("should return applications for user from DAO", async () => {
			const mockApplications = [
				{
					applicationId: "app-1",
					userId: "user-123",
					jobRoleId: "role-1",
					status: "IN_PROGRESS",
					appliedAt: new Date("2026-02-16"),
					cvUrl: "https://example.com/cv1.pdf",
				},
				{
					applicationId: "app-2",
					userId: "user-123",
					jobRoleId: "role-2",
					status: "ACCEPTED",
					appliedAt: new Date("2026-02-15"),
					cvUrl: "https://example.com/cv2.pdf",
				},
			];

			(mockApplicationDao.getApplicationsForUser as Mock).mockResolvedValue(
				mockApplications,
			);

			const result =
				await applicationService.getApplicationsForUser("user-123");

			expect(mockApplicationDao.getApplicationsForUser).toHaveBeenCalledWith(
				"user-123",
			);
			expect(result).toEqual(mockApplications);
			expect(result).toHaveLength(2);
		});

		it("should return empty array when user has no applications", async () => {
			(mockApplicationDao.getApplicationsForUser as Mock).mockResolvedValue([]);

			const result =
				await applicationService.getApplicationsForUser("user-456");

			expect(mockApplicationDao.getApplicationsForUser).toHaveBeenCalledWith(
				"user-456",
			);
			expect(result).toEqual([]);
		});

		it("should throw error when DAO fails", async () => {
			const daoError = new Error("Database error");
			(mockApplicationDao.getApplicationsForUser as Mock).mockRejectedValue(
				daoError,
			);

			await expect(
				applicationService.getApplicationsForUser("user-123"),
			).rejects.toThrow("Database error");
		});
	});

	describe("getApplicationByJobRoleId", () => {
		it("should return applications for a specific job role from DAO", async () => {
			const mockApplications = [
				{
					applicationId: "app-1",
					userId: "user-1",
					jobRoleId: "role-123",
					status: "IN_PROGRESS",
					appliedAt: new Date("2026-02-16"),
					cvUrl: "https://example.com/cv1.pdf",
				},
				{
					applicationId: "app-2",
					userId: "user-2",
					jobRoleId: "role-123",
					status: "HIRED",
					appliedAt: new Date("2026-02-15"),
					cvUrl: "https://example.com/cv2.pdf",
				},
			];

			(mockApplicationDao.getApplicationsByJobRoleId as Mock).mockResolvedValue(
				mockApplications,
			);

			const result =
				await applicationService.getApplicationByJobRoleId("role-123");

			expect(
				mockApplicationDao.getApplicationsByJobRoleId,
			).toHaveBeenCalledWith("role-123");
			expect(result).toEqual(mockApplications);
			expect(result).toHaveLength(2);
		});

		it("should return empty array when no applications exist for the job role", async () => {
			(mockApplicationDao.getApplicationsByJobRoleId as Mock).mockResolvedValue(
				[],
			);

			const result =
				await applicationService.getApplicationByJobRoleId("role-999");

			expect(
				mockApplicationDao.getApplicationsByJobRoleId,
			).toHaveBeenCalledWith("role-999");
			expect(result).toEqual([]);
		});

		it("should throw error when DAO fails", async () => {
			const daoError = new Error("Database error");
			(mockApplicationDao.getApplicationsByJobRoleId as Mock).mockRejectedValue(
				daoError,
			);

			await expect(
				applicationService.getApplicationByJobRoleId("role-123"),
			).rejects.toThrow("Database error");
		});

		it("should pass through the exact jobRoleId to DAO", async () => {
			(mockApplicationDao.getApplicationsByJobRoleId as Mock).mockResolvedValue(
				[],
			);

			const specificJobRoleId = "unique-job-role-id-789";
			await applicationService.getApplicationByJobRoleId(specificJobRoleId);

			expect(
				mockApplicationDao.getApplicationsByJobRoleId,
			).toHaveBeenCalledWith(specificJobRoleId);
		});
	});

	describe("updateApplicationStatus", () => {
		it("should update application status successfully", async () => {
			(mockApplicationDao.updateApplicationStatus as Mock).mockResolvedValue(
				undefined,
			);

			await applicationService.updateApplicationStatus(
				"app-123",
				ApplicationStatus.HIRED,
			);

			expect(mockApplicationDao.updateApplicationStatus).toHaveBeenCalledWith(
				"app-123",
				ApplicationStatus.HIRED,
			);
		});

		it("should update application status to REJECTED", async () => {
			(mockApplicationDao.updateApplicationStatus as Mock).mockResolvedValue(
				undefined,
			);

			await applicationService.updateApplicationStatus(
				"app-456",
				ApplicationStatus.REJECTED,
			);

			expect(mockApplicationDao.updateApplicationStatus).toHaveBeenCalledWith(
				"app-456",
				ApplicationStatus.REJECTED,
			);
		});

		it("should update application status to IN_PROGRESS", async () => {
			(mockApplicationDao.updateApplicationStatus as Mock).mockResolvedValue(
				undefined,
			);

			await applicationService.updateApplicationStatus(
				"app-789",
				ApplicationStatus.IN_PROGRESS,
			);

			expect(mockApplicationDao.updateApplicationStatus).toHaveBeenCalledWith(
				"app-789",
				ApplicationStatus.IN_PROGRESS,
			);
		});

		it("should throw error when DAO fails", async () => {
			const daoError = new Error("Database error");

			(mockApplicationDao.updateApplicationStatus as Mock).mockRejectedValue(
				daoError,
			);

			await expect(
				applicationService.updateApplicationStatus(
					"app-123",
					ApplicationStatus.HIRED,
				),
			).rejects.toThrow("Database error");
		});

		it("should pass exact parameters to DAO", async () => {
			(mockApplicationDao.updateApplicationStatus as Mock).mockResolvedValue(
				undefined,
			);

			const appId = "specific-app-id";
			const status = ApplicationStatus.HIRED;

			await applicationService.updateApplicationStatus(appId, status);

			expect(mockApplicationDao.updateApplicationStatus).toHaveBeenCalledWith(
				appId,
				status,
			);
		});
	});
});

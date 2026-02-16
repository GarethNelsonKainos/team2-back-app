import { describe, it, expect, vi, beforeEach } from "vitest";
import { ApplicationService } from "../../src/services/application.service.js";
import { ApplicationDao } from "../../src/daos/application.dao.js";

vi.mock("../../src/daos/application.dao.js");

describe("ApplicationService", () => {
	let service: ApplicationService;
	let mockGetApplications: any;
	let mockGetApplicationById: any;
	let mockGetApplicationsForUser: any;
	let mockCreateApplication: any;
	let mockUpdateApplication: any;
	let mockDeleteApplication: any;

	const mockApplication = {
		applicationId: "app-123",
		userId: "user-123",
		jobRoleId: "role-123",
		status: "applied",
		appliedAt: new Date("2026-02-16"),
		cvUrl: "https://example.com/cv.pdf",
	};

	const mockApplications = [
		mockApplication,
		{
			applicationId: "app-456",
			userId: "user-456",
			jobRoleId: "role-456",
			status: "accepted",
			appliedAt: new Date("2026-02-15"),
			cvUrl: "https://example.com/cv2.pdf",
		},
	];

	beforeEach(() => {
		mockGetApplications = vi.fn().mockResolvedValue(mockApplications);
		mockGetApplicationById = vi.fn();
		mockGetApplicationsForUser = vi.fn();
		mockCreateApplication = vi.fn();
		mockUpdateApplication = vi.fn();
		mockDeleteApplication = vi.fn();

		ApplicationDao.prototype.getAllApplications = mockGetApplications;
		ApplicationDao.prototype.getApplicationById = mockGetApplicationById;
		ApplicationDao.prototype.getAllApplicationsForUser =
			mockGetApplicationsForUser;
		ApplicationDao.prototype.createApplication = mockCreateApplication;
		ApplicationDao.prototype.updateApplication = mockUpdateApplication;
		ApplicationDao.prototype.deleteApplication = mockDeleteApplication;

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
		it("should create and return new application", async () => {
			const applicationData = {
				userId: "user-123",
				jobRoleId: "role-123",
				cvUrl: "https://example.com/cv.pdf",
			};
			mockCreateApplication.mockResolvedValue(mockApplication);

			const result = await service.createApplication(applicationData);

			expect(result).toEqual(mockApplication);
			expect(mockCreateApplication).toHaveBeenCalledWith(applicationData);
			expect(mockCreateApplication).toHaveBeenCalledTimes(1);
		});

		it("should pass application data to DAO unchanged", async () => {
			const applicationData = {
				userId: "user-456",
				jobRoleId: "role-456",
				cvUrl: "https://example.com/cv2.pdf",
			};
			mockCreateApplication.mockResolvedValue(mockApplications[1]);

			await service.createApplication(applicationData);

			expect(mockCreateApplication).toHaveBeenCalledWith(applicationData);
		});

		it("should propagate errors from DAO", async () => {
			const error = new Error("Validation error");
			mockCreateApplication.mockRejectedValue(error);

			const applicationData = {
				userId: "user-123",
				jobRoleId: "role-123",
				cvUrl: "https://example.com/cv.pdf",
			};

			await expect(service.createApplication(applicationData)).rejects.toThrow(
				"Validation error",
			);
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

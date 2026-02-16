import { describe, it, expect, vi, beforeEach } from "vitest";
import { ApplicationDao } from "../../src/daos/application.dao.js";
import { prisma } from "../../src/daos/prisma.js";
import type { Applications } from "../../src/generated/prisma/client.js";

vi.mock("../../src/daos/prisma.js", () => ({
	prisma: {
		applications: {
			findMany: vi.fn(),
			findUnique: vi.fn(),
			create: vi.fn(),
			update: vi.fn(),
			delete: vi.fn(),
		},
	},
}));

describe("ApplicationDao", () => {
	let dao: ApplicationDao;

	const mockApplication: Applications = {
		applicationId: "app-123",
		userId: "user-123",
		jobRoleId: "role-123",
		status: "applied",
		appliedAt: new Date("2026-02-16"),
		cvUrl: "https://example.com/cv.pdf",
	};

	const mockApplications: Applications[] = [
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
		dao = new ApplicationDao();
		vi.clearAllMocks();
	});

	describe("getAllApplications", () => {
		it("should call prisma.applications.findMany with no parameters", async () => {
			const mockFindMany = vi.mocked(prisma.applications.findMany);
			mockFindMany.mockResolvedValue(mockApplications);

			await dao.getAllApplications();

			expect(mockFindMany).toHaveBeenCalledOnce();
			expect(mockFindMany).toHaveBeenCalledWith({});
		});

		it("should return all applications", async () => {
			const mockFindMany = vi.mocked(prisma.applications.findMany);
			mockFindMany.mockResolvedValue(mockApplications);

			const result = await dao.getAllApplications();

			expect(result).toEqual(mockApplications);
			expect(result).toHaveLength(2);
		});

		it("should return empty array when no applications exist", async () => {
			const mockFindMany = vi.mocked(prisma.applications.findMany);
			mockFindMany.mockResolvedValue([]);

			const result = await dao.getAllApplications();

			expect(result).toEqual([]);
			expect(result).toHaveLength(0);
		});

		it("should propagate errors from prisma", async () => {
			const mockFindMany = vi.mocked(prisma.applications.findMany);
			const dbError = new Error("Database connection failed");
			mockFindMany.mockRejectedValue(dbError);

			await expect(dao.getAllApplications()).rejects.toThrow(
				"Database connection failed",
			);
		});
	});

	describe("getApplicationById", () => {
		it("should call prisma.applications.findUnique with correct parameters", async () => {
			const mockFindUnique = vi.mocked(prisma.applications.findUnique);
			mockFindUnique.mockResolvedValue(mockApplication);

			await dao.getApplicationById("app-123");

			expect(mockFindUnique).toHaveBeenCalledOnce();
			expect(mockFindUnique).toHaveBeenCalledWith({
				where: { applicationId: "app-123" },
			});
		});

		it("should return application when found", async () => {
			const mockFindUnique = vi.mocked(prisma.applications.findUnique);
			mockFindUnique.mockResolvedValue(mockApplication);

			const result = await dao.getApplicationById("app-123");

			expect(result).toEqual(mockApplication);
			expect(result?.applicationId).toBe("app-123");
		});

		it("should return null when application does not exist", async () => {
			const mockFindUnique = vi.mocked(prisma.applications.findUnique);
			mockFindUnique.mockResolvedValue(null);

			const result = await dao.getApplicationById("non-existent-id");

			expect(result).toBeNull();
		});

		it("should propagate errors from prisma", async () => {
			const mockFindUnique = vi.mocked(prisma.applications.findUnique);
			const dbError = new Error("Database connection failed");
			mockFindUnique.mockRejectedValue(dbError);

			await expect(dao.getApplicationById("app-123")).rejects.toThrow(
				"Database connection failed",
			);
		});
	});

	describe("createApplication", () => {
		it("should call prisma.applications.create with correct parameters", async () => {
			const mockCreate = vi.mocked(prisma.applications.create);
			mockCreate.mockResolvedValue(mockApplication);

			const applicationData = {
				userId: "user-123",
				jobRoleId: "role-123",
				cvUrl: "https://example.com/cv.pdf",
			};

			await dao.createApplication(applicationData);

			expect(mockCreate).toHaveBeenCalledOnce();
			expect(mockCreate).toHaveBeenCalledWith({
				data: applicationData,
			});
		});

		it("should return created application", async () => {
			const mockCreate = vi.mocked(prisma.applications.create);
			mockCreate.mockResolvedValue(mockApplication);

			const applicationData = {
				userId: "user-123",
				jobRoleId: "role-123",
				cvUrl: "https://example.com/cv.pdf",
			};

			const result = await dao.createApplication(applicationData);

			expect(result).toEqual(mockApplication);
			expect(result.applicationId).toBe("app-123");
		});

		it("should propagate errors from prisma", async () => {
			const mockCreate = vi.mocked(prisma.applications.create);
			const dbError = new Error("Unique constraint failed");
			mockCreate.mockRejectedValue(dbError);

			const applicationData = {
				userId: "user-123",
				jobRoleId: "role-123",
				cvUrl: "https://example.com/cv.pdf",
			};

			await expect(dao.createApplication(applicationData)).rejects.toThrow(
				"Unique constraint failed",
			);
		});
	});

	describe("updateApplication", () => {
		it("should call prisma.applications.update with correct parameters", async () => {
			const mockUpdate = vi.mocked(prisma.applications.update);
			const updatedApplication = { ...mockApplication, status: "rejected" };
			mockUpdate.mockResolvedValue(updatedApplication);

			const updateData = { status: "rejected" };

			await dao.updateApplication("app-123", updateData);

			expect(mockUpdate).toHaveBeenCalledOnce();
			expect(mockUpdate).toHaveBeenCalledWith({
				where: { applicationId: "app-123" },
				data: updateData,
			});
		});

		it("should return updated application", async () => {
			const mockUpdate = vi.mocked(prisma.applications.update);
			const updatedApplication = { ...mockApplication, status: "accepted" };
			mockUpdate.mockResolvedValue(updatedApplication);

			const updateData = { status: "accepted" };

			const result = await dao.updateApplication("app-123", updateData);

			expect(result).toEqual(updatedApplication);
			expect(result.status).toBe("accepted");
		});

		it("should propagate errors from prisma", async () => {
			const mockUpdate = vi.mocked(prisma.applications.update);
			const dbError = new Error("Record not found");
			mockUpdate.mockRejectedValue(dbError);

			const updateData = { status: "accepted" };

			await expect(
				dao.updateApplication("app-123", updateData),
			).rejects.toThrow("Record not found");
		});
	});

	describe("deleteApplication", () => {
		it("should call prisma.applications.delete with correct parameters", async () => {
			const mockDelete = vi.mocked(prisma.applications.delete);
			mockDelete.mockResolvedValue(mockApplication);

			await dao.deleteApplication("app-123");

			expect(mockDelete).toHaveBeenCalledOnce();
			expect(mockDelete).toHaveBeenCalledWith({
				where: { applicationId: "app-123" },
			});
		});

		it("should return deleted application", async () => {
			const mockDelete = vi.mocked(prisma.applications.delete);
			mockDelete.mockResolvedValue(mockApplication);

			const result = await dao.deleteApplication("app-123");

			expect(result).toEqual(mockApplication);
			expect(result.applicationId).toBe("app-123");
		});

		it("should propagate errors from prisma", async () => {
			const mockDelete = vi.mocked(prisma.applications.delete);
			const dbError = new Error("Record not found");
			mockDelete.mockRejectedValue(dbError);

			await expect(dao.deleteApplication("app-123")).rejects.toThrow(
				"Record not found",
			);
		});
	});

	describe("getAllApplicationsForUser", () => {
		it("should call prisma.applications.findMany with correct user filter", async () => {
			const mockFindMany = vi.mocked(prisma.applications.findMany);
			const userApplications = [mockApplication];
			mockFindMany.mockResolvedValue(userApplications);

			await dao.getAllApplicationsForUser("user-123");

			expect(mockFindMany).toHaveBeenCalledOnce();
			expect(mockFindMany).toHaveBeenCalledWith({
				where: { userId: "user-123" },
			});
		});

		it("should return applications for specific user", async () => {
			const mockFindMany = vi.mocked(prisma.applications.findMany);
			const userApplications = [mockApplication];
			mockFindMany.mockResolvedValue(userApplications);

			const result = await dao.getAllApplicationsForUser("user-123");

			expect(result).toEqual(userApplications);
			expect(result).toHaveLength(1);
			expect(result[0].userId).toBe("user-123");
		});

		it("should return empty array when user has no applications", async () => {
			const mockFindMany = vi.mocked(prisma.applications.findMany);
			mockFindMany.mockResolvedValue([]);

			const result = await dao.getAllApplicationsForUser("user-no-apps");

			expect(result).toEqual([]);
			expect(result).toHaveLength(0);
		});

		it("should propagate errors from prisma", async () => {
			const mockFindMany = vi.mocked(prisma.applications.findMany);
			const dbError = new Error("Database connection failed");
			mockFindMany.mockRejectedValue(dbError);

			await expect(dao.getAllApplicationsForUser("user-123")).rejects.toThrow(
				"Database connection failed",
			);
		});
	});
});

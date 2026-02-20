import { describe, it, expect, vi, beforeEach } from "vitest";
import { ApplicationDao } from "../../src/daos/application.dao";
import type { Applications } from "../../src/generated/prisma/client";
import {
	type JobApplication,
	ApplicationStatus,
} from "../../src/types/CreateApplication";
import { prisma } from "../../src/daos/prisma";

vi.mock("../../src/daos/prisma.js", () => ({
	prisma: {
		applications: {
			create: vi.fn(),
			findMany: vi.fn(),
			update: vi.fn(),
		},
	},
}));

describe("ApplicationDao", () => {
	let dao: ApplicationDao;

	const mockJobApplication: JobApplication = {
		userId: "user-123",
		jobRoleId: "role-123",
		status: ApplicationStatus.IN_PROGRESS,
		cvUrl: "https://example.com/cv.pdf",
	};

	const mockCreatedApplication: Applications = {
		applicationId: "app-123",
		userId: "user-123",
		jobRoleId: "role-123",
		status: "IN_PROGRESS",
		appliedAt: new Date("2026-02-16"),
		cvUrl: "https://example.com/cv.pdf",
	};

	beforeEach(() => {
		dao = new ApplicationDao();
		vi.clearAllMocks();
	});

	describe("createApplication", () => {
		it("should create an application with correct data", async () => {
			vi.mocked(prisma.applications.create).mockResolvedValue(
				mockCreatedApplication,
			);

			const result = await dao.createApplication(mockJobApplication);

			expect(prisma.applications.create).toHaveBeenCalledWith({
				data: {
					...mockJobApplication,
				},
			});
			expect(result).toEqual(mockCreatedApplication);
		});

		it("should throw an error when prisma create fails", async () => {
			const error = new Error("Database error");
			vi.mocked(prisma.applications.create).mockRejectedValue(error);

			await expect(dao.createApplication(mockJobApplication)).rejects.toThrow(
				"Database error",
			);
		});
	});

	describe("getApplicationsForUser", () => {
		const mockApplications: Applications[] = [
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

		it("should return applications for a user with jobRole included", async () => {
			vi.mocked(prisma.applications.findMany).mockResolvedValue(
				mockApplications,
			);

			const result = await dao.getApplicationsForUser("user-123");

			expect(prisma.applications.findMany).toHaveBeenCalledWith({
				where: {
					userId: "user-123",
				},
				include: {
					jobRole: true,
				},
			});
			expect(result).toEqual(mockApplications);
		});

		it("should return empty array when user has no applications", async () => {
			vi.mocked(prisma.applications.findMany).mockResolvedValue([]);

			const result = await dao.getApplicationsForUser("user-456");

			expect(prisma.applications.findMany).toHaveBeenCalledWith({
				where: {
					userId: "user-456",
				},
				include: {
					jobRole: true,
				},
			});
			expect(result).toEqual([]);
		});

		it("should throw an error when prisma findMany fails", async () => {
			const error = new Error("Database error");
			vi.mocked(prisma.applications.findMany).mockRejectedValue(error);

			await expect(dao.getApplicationsForUser("user-123")).rejects.toThrow(
				"Database error",
			);
		});
	});

	describe("getApplicationsByJobRoleId", () => {
		const mockApplications: Applications[] = [
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

		it("should return all applications for a specific job role", async () => {
			vi.mocked(prisma.applications.findMany).mockResolvedValue(
				mockApplications,
			);

			const result = await dao.getApplicationsByJobRoleId("role-123");

			expect(prisma.applications.findMany).toHaveBeenCalledWith({
				where: {
					jobRoleId: "role-123",
				},
				include: {
					user: {
						select: {
							firstName: true,
							secondName: true,
						},
					},
					jobRole: {
						select: {
							roleName: true,
							location: true,
						},
					},
				},
			});
			expect(result).toEqual(mockApplications);
		});

		it("should return empty array when no applications exist for the job role", async () => {
			vi.mocked(prisma.applications.findMany).mockResolvedValue([]);

			const result = await dao.getApplicationsByJobRoleId("role-999");

			expect(prisma.applications.findMany).toHaveBeenCalledWith({
				where: {
					jobRoleId: "role-999",
				},
				include: {
					user: {
						select: {
							firstName: true,
							secondName: true,
						},
					},
					jobRole: {
						select: {
							roleName: true,
							location: true,
						},
					},
				},
			});
			expect(result).toEqual([]);
		});

		it("should throw an error when prisma findMany fails", async () => {
			const error = new Error("Database error");
			vi.mocked(prisma.applications.findMany).mockRejectedValue(error);

			await expect(dao.getApplicationsByJobRoleId("role-123")).rejects.toThrow(
				"Database error",
			);
		});
	});

	describe("updateApplicationStatus", () => {
		const mockUpdatedApplication: Applications = {
			applicationId: "app-123",
			userId: "user-123",
			jobRoleId: "role-123",
			status: "HIRED",
			appliedAt: new Date("2026-02-16"),
			cvUrl: "https://example.com/cv.pdf",
		};

		it("should update application status successfully", async () => {
			vi.mocked(prisma.applications.update).mockResolvedValue(
				mockUpdatedApplication,
			);

			await dao.updateApplicationStatus("app-123", "HIRED");

			expect(prisma.applications.update).toHaveBeenCalledWith({
				where: {
					applicationId: "app-123",
				},
				data: {
					status: "HIRED",
				},
			});
		});

		it("should update application status to REJECTED", async () => {
			const rejectedApp = { ...mockUpdatedApplication, status: "REJECTED" };
			vi.mocked(prisma.applications.update).mockResolvedValue(rejectedApp);

			await dao.updateApplicationStatus("app-456", "REJECTED");

			expect(prisma.applications.update).toHaveBeenCalledWith({
				where: {
					applicationId: "app-456",
				},
				data: {
					status: "REJECTED",
				},
			});
		});

		it("should update application status to IN_PROGRESS", async () => {
			const inProgressApp = {
				...mockUpdatedApplication,
				status: "IN_PROGRESS",
			};
			vi.mocked(prisma.applications.update).mockResolvedValue(inProgressApp);

			await dao.updateApplicationStatus("app-789", "IN_PROGRESS");

			expect(prisma.applications.update).toHaveBeenCalledWith({
				where: {
					applicationId: "app-789",
				},
				data: {
					status: "IN_PROGRESS",
				},
			});
		});

		it("should throw an error when prisma update fails", async () => {
			const error = new Error("Database error");

			vi.mocked(prisma.applications.update).mockRejectedValue(error);

			await expect(
				dao.updateApplicationStatus("app-123", "HIRED"),
			).rejects.toThrow("Database error");
		});
	});
});

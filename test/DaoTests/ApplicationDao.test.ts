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
});

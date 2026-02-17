import { describe, it, expect, vi, beforeEach } from "vitest";
import { ApplicationDao } from "../../src/daos/application.dao.js";
import { prisma } from "../../src/daos/prisma.js";
import type {
	Applications,
	Prisma,
} from "../../src/generated/prisma/client.js";

vi.mock("../../src/daos/prisma.js", () => ({
	prisma: {
		applications: {
			create: vi.fn(),
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

	beforeEach(() => {
		dao = new ApplicationDao();
		vi.clearAllMocks();
	});

	describe("createApplication", () => {
		it("should call prisma.applications.create with correct parameters", async () => {
			const mockCreate = vi.mocked(prisma.applications.create);
			mockCreate.mockResolvedValue(mockApplication);

			const applicationData: Prisma.ApplicationsUncheckedCreateInput = {
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

			const applicationData: Prisma.ApplicationsUncheckedCreateInput = {
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

			const applicationData: Prisma.ApplicationsUncheckedCreateInput = {
				userId: "user-123",
				jobRoleId: "role-123",
				cvUrl: "https://example.com/cv.pdf",
			};

			await expect(dao.createApplication(applicationData)).rejects.toThrow(
				"Unique constraint failed",
			);
		});
	});
});

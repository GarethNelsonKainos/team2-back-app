import {
	describe,
	it,
	expect,
	vi,
	beforeEach,
	afterEach,
	type Mock,
} from "vitest";
import type { Request, Response } from "express";
import { ApplicationController } from "../../src/controllers/application.controller.js";
import type { ApplicationService } from "../../src/services/application.service.js";

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
	let applicationController: ApplicationController;
	let mockApplicationService: ApplicationService;
	let mockRequest: Partial<Request>;
	let mockResponse: Partial<Response>;
	let statusMock: Mock;
	let jsonMock: Mock;
	let sendMock: Mock;
	let sendStatusMock: Mock;

	beforeEach(() => {
		mockApplicationService = {
			createApplication: vi.fn(),
			getApplicationsForUser: vi.fn(),
			getApplicationByJobRoleId: vi.fn(),
			updateApplicationStatus: vi.fn(),
		} as unknown as ApplicationService;

		applicationController = new ApplicationController(mockApplicationService);

		jsonMock = vi.fn();
		sendMock = vi.fn();
		sendStatusMock = vi.fn();
		statusMock = vi.fn().mockReturnValue({
			json: jsonMock,
			send: sendMock,
		});

		mockRequest = {
			body: {},
			file: undefined,
		};

		mockResponse = {
			status: statusMock,
			json: jsonMock,
			sendStatus: sendStatusMock,
			locals: {
				user: {
					userId: "test-user-id",
				},
			},
		};
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	describe("createApplication", () => {
		it("should return a 400 status if file doesn't exist", async () => {
			mockRequest.body = {
				jobRoleId: "test-job-role-id",
			};
			mockRequest.file = undefined;

			await applicationController.createApplication(
				mockRequest as Request,
				mockResponse as Response,
			);

			expect(statusMock).toHaveBeenCalledWith(400);
			expect(jsonMock).toHaveBeenCalledWith({ error: "CV file is required" });
			expect(mockApplicationService.createApplication).not.toHaveBeenCalled();
		});

		it("should return 201 when application is created successfully", async () => {
			const mockFile = createMockFile();
			mockRequest.body = {
				jobRoleId: "test-job-role-id",
			};
			mockRequest.file = mockFile;

			(mockApplicationService.createApplication as Mock).mockResolvedValue(
				undefined,
			);

			await applicationController.createApplication(
				mockRequest as Request,
				mockResponse as Response,
			);

			expect(mockApplicationService.createApplication).toHaveBeenCalledWith(
				{
					jobRoleId: "test-job-role-id",
					userId: "test-user-id",
				},
				mockFile,
			);
			expect(statusMock).toHaveBeenCalledWith(201);
			expect(sendMock).toHaveBeenCalled();
		});

		it("should return 500 when service throws an error", async () => {
			const mockFile = createMockFile();
			mockRequest.body = {
				jobRoleId: "test-job-role-id",
			};
			mockRequest.file = mockFile;

			const consoleErrorSpy = vi
				.spyOn(console, "error")
				.mockImplementation(() => {});

			(mockApplicationService.createApplication as Mock).mockRejectedValue(
				new Error("Service error"),
			);

			await applicationController.createApplication(
				mockRequest as Request,
				mockResponse as Response,
			);

			expect(mockApplicationService.createApplication).toHaveBeenCalledWith(
				{
					jobRoleId: "test-job-role-id",
					userId: "test-user-id",
				},
				mockFile,
			);
			expect(consoleErrorSpy).toHaveBeenCalledWith(
				"Error creating application:",
				expect.any(Error),
			);
			expect(statusMock).toHaveBeenCalledWith(500);
			expect(sendMock).toHaveBeenCalled();

			consoleErrorSpy.mockRestore();
		});
	});

	describe("getApplicationsForUser", () => {
		it("should return applications with 200 status", async () => {
			const mockApplications = [
				{
					applicationId: "app-1",
					userId: "test-user-id",
					jobRoleId: "role-1",
					status: "IN_PROGRESS",
					appliedAt: new Date(),
					cvUrl: "https://example.com/cv.pdf",
				},
				{
					applicationId: "app-2",
					userId: "test-user-id",
					jobRoleId: "role-2",
					status: "ACCEPTED",
					appliedAt: new Date(),
					cvUrl: "https://example.com/cv2.pdf",
				},
			];

			(mockApplicationService.getApplicationsForUser as Mock).mockResolvedValue(
				mockApplications,
			);

			await applicationController.getApplicationsForUser(
				mockRequest as Request,
				mockResponse as Response,
			);

			expect(
				mockApplicationService.getApplicationsForUser,
			).toHaveBeenCalledWith("test-user-id");
			expect(jsonMock).toHaveBeenCalledWith(mockApplications);
		});

		it("should return empty array with 200 status when user has no applications", async () => {
			(mockApplicationService.getApplicationsForUser as Mock).mockResolvedValue(
				[],
			);

			await applicationController.getApplicationsForUser(
				mockRequest as Request,
				mockResponse as Response,
			);

			expect(
				mockApplicationService.getApplicationsForUser,
			).toHaveBeenCalledWith("test-user-id");
			expect(jsonMock).toHaveBeenCalledWith([]);
		});

		it("should return 500 when service throws an error", async () => {
			const consoleErrorSpy = vi
				.spyOn(console, "error")
				.mockImplementation(() => {});

			(mockApplicationService.getApplicationsForUser as Mock).mockRejectedValue(
				new Error("Service error"),
			);

			await applicationController.getApplicationsForUser(
				mockRequest as Request,
				mockResponse as Response,
			);

			expect(
				mockApplicationService.getApplicationsForUser,
			).toHaveBeenCalledWith("test-user-id");
			expect(consoleErrorSpy).toHaveBeenCalledWith(
				"Error fetching applications for user:",
				expect.any(Error),
			);
			expect(statusMock).toHaveBeenCalledWith(500);
			expect(sendMock).toHaveBeenCalled();

			consoleErrorSpy.mockRestore();
		});
	});

	describe("getApplicationByJobRoleId", () => {
		it("should return applications for a specific job role with 200 status", async () => {
			const mockApplications = [
				{
					applicationId: "app-1",
					userId: "user-1",
					jobRoleId: "role-1",
					status: "IN_PROGRESS",
					appliedAt: new Date(),
					cvUrl: "https://example.com/cv1.pdf",
				},
				{
					applicationId: "app-2",
					userId: "user-2",
					jobRoleId: "role-1",
					status: "HIRED",
					appliedAt: new Date(),
					cvUrl: "https://example.com/cv2.pdf",
				},
			];

			mockRequest.params = { jobRoleId: "role-1" };

			(
				mockApplicationService.getApplicationByJobRoleId as Mock
			).mockResolvedValue(mockApplications);

			await applicationController.getApplicationByJobRoleId(
				mockRequest as Request,
				mockResponse as Response,
			);

			expect(
				mockApplicationService.getApplicationByJobRoleId,
			).toHaveBeenCalledWith("role-1");
			expect(jsonMock).toHaveBeenCalledWith(mockApplications);
		});

		it("should return empty array when no applications exist for the job role", async () => {
			mockRequest.params = { jobRoleId: "non-existent-role" };

			(
				mockApplicationService.getApplicationByJobRoleId as Mock
			).mockResolvedValue([]);

			await applicationController.getApplicationByJobRoleId(
				mockRequest as Request,
				mockResponse as Response,
			);

			expect(
				mockApplicationService.getApplicationByJobRoleId,
			).toHaveBeenCalledWith("non-existent-role");
			expect(jsonMock).toHaveBeenCalledWith([]);
		});

		it("should return 500 when service throws an error", async () => {
			const consoleErrorSpy = vi
				.spyOn(console, "error")
				.mockImplementation(() => {});

			mockRequest.params = { jobRoleId: "role-1" };

			(
				mockApplicationService.getApplicationByJobRoleId as Mock
			).mockRejectedValue(new Error("Service error"));

			await applicationController.getApplicationByJobRoleId(
				mockRequest as Request,
				mockResponse as Response,
			);

			expect(
				mockApplicationService.getApplicationByJobRoleId,
			).toHaveBeenCalledWith("role-1");
			expect(consoleErrorSpy).toHaveBeenCalledWith(
				"Error fetching applications for job role:",
				expect.any(Error),
			);
			expect(statusMock).toHaveBeenCalledWith(500);
			expect(sendMock).toHaveBeenCalled();

			consoleErrorSpy.mockRestore();
		});
	});

	describe("updateApplicationStatus", () => {
		it("should update application status and return 200", async () => {
			mockRequest.params = {
				applicationId: "app-1",
				status: "HIRED",
			};

			const consoleLogSpy = vi
				.spyOn(console, "log")
				.mockImplementation(() => {});

			(
				mockApplicationService.updateApplicationStatus as Mock
			).mockResolvedValue(undefined);

			await applicationController.updateApplicationStatus(
				mockRequest as Request,
				mockResponse as Response,
			);

			expect(
				mockApplicationService.updateApplicationStatus,
			).toHaveBeenCalledWith("app-1", "HIRED");
			expect(mockResponse.sendStatus).toHaveBeenCalledWith(200);

			consoleLogSpy.mockRestore();
		});

		it("should update application status to REJECTED", async () => {
			mockRequest.params = {
				applicationId: "app-2",
				status: "REJECTED",
			};

			const consoleLogSpy = vi
				.spyOn(console, "log")
				.mockImplementation(() => {});

			(
				mockApplicationService.updateApplicationStatus as Mock
			).mockResolvedValue(undefined);

			await applicationController.updateApplicationStatus(
				mockRequest as Request,
				mockResponse as Response,
			);

			expect(
				mockApplicationService.updateApplicationStatus,
			).toHaveBeenCalledWith("app-2", "REJECTED");
			expect(mockResponse.sendStatus).toHaveBeenCalledWith(200);

			consoleLogSpy.mockRestore();
		});

		it("should update application status to IN_PROGRESS", async () => {
			mockRequest.params = {
				applicationId: "app-3",
				status: "IN_PROGRESS",
			};

			const consoleLogSpy = vi
				.spyOn(console, "log")
				.mockImplementation(() => {});

			(
				mockApplicationService.updateApplicationStatus as Mock
			).mockResolvedValue(undefined);

			await applicationController.updateApplicationStatus(
				mockRequest as Request,
				mockResponse as Response,
			);

			expect(
				mockApplicationService.updateApplicationStatus,
			).toHaveBeenCalledWith("app-3", "IN_PROGRESS");
			expect(mockResponse.sendStatus).toHaveBeenCalledWith(200);

			consoleLogSpy.mockRestore();
		});

		it("should return 500 when service throws an error", async () => {
			const consoleErrorSpy = vi
				.spyOn(console, "error")
				.mockImplementation(() => {});
			const consoleLogSpy = vi
				.spyOn(console, "log")
				.mockImplementation(() => {});

			mockRequest.params = {
				applicationId: "app-1",
				status: "HIRED",
			};

			(
				mockApplicationService.updateApplicationStatus as Mock
			).mockRejectedValue(new Error("Service error"));

			await applicationController.updateApplicationStatus(
				mockRequest as Request,
				mockResponse as Response,
			);

			expect(
				mockApplicationService.updateApplicationStatus,
			).toHaveBeenCalledWith("app-1", "HIRED");
			expect(consoleErrorSpy).toHaveBeenCalledWith(
				"Error updating application status:",
				expect.any(Error),
			);
			expect(statusMock).toHaveBeenCalledWith(500);
			expect(sendMock).toHaveBeenCalled();

			consoleErrorSpy.mockRestore();
			consoleLogSpy.mockRestore();
		});
	});
});

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

	beforeEach(() => {
		mockApplicationService = {
			createApplication: vi.fn(),
			getApplicationsForUser: vi.fn(),
		} as unknown as ApplicationService;

		applicationController = new ApplicationController(mockApplicationService);

		jsonMock = vi.fn();
		sendMock = vi.fn();
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

			expect(mockApplicationService.getApplicationsForUser).toHaveBeenCalledWith(
				"test-user-id",
			);
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

			expect(mockApplicationService.getApplicationsForUser).toHaveBeenCalledWith(
				"test-user-id",
			);
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

			expect(mockApplicationService.getApplicationsForUser).toHaveBeenCalledWith(
				"test-user-id",
			);
			expect(consoleErrorSpy).toHaveBeenCalledWith(
				"Error fetching applications for user:",
				expect.any(Error),
			);
			expect(statusMock).toHaveBeenCalledWith(500);
			expect(sendMock).toHaveBeenCalled();

			consoleErrorSpy.mockRestore();
		});
	});
});

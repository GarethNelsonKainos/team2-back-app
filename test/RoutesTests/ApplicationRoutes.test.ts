import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import express from "express";
import request from "supertest";
import jwt from "jsonwebtoken";
import { ApplicationDao } from "../../src/daos/application.dao.js";
import { S3Service } from "../../src/services/s3.service.js";
import applicationRouter from "../../src/routes/application.routes.js";
import { ApplicationController } from "../../src/controllers/application.controller.js";
import { ApplicationService } from "../../src/services/application.service.js";

vi.mock("../../src/services/s3.service.js");
vi.mock("../../src/daos/application.dao.js");

describe("ApplicationRoutes - integration tests", () => {
	let app: express.Application;
	let validToken: string;
	let createApplicationSpy: ReturnType<typeof vi.spyOn>;
	let uploadFileSpy: ReturnType<typeof vi.spyOn>;
	let generateFileKeySpy: ReturnType<typeof vi.spyOn>;
	let getApplicationsForUserSpy: ReturnType<typeof vi.spyOn>;

	const mockUser = {
		userId: "550e8400-e29b-41d4-a716-446655440000",
		email: "test@example.com",
		firstName: "Test",
		secondName: "User",
		role: "user",
	};

	beforeEach(() => {
		// Set up JWT secret and generate valid token
		process.env.JWT_SECRET = "test-secret-key";
		validToken = jwt.sign(mockUser, process.env.JWT_SECRET, {
			expiresIn: "1h",
		});

		// Create spies for mocked services
		createApplicationSpy = vi
			.spyOn(ApplicationDao.prototype, "createApplication")
			.mockResolvedValue({
				applicationId: "app-id-123",
				userId: mockUser.userId,
				jobRoleId: "job-role-id-123",
				cvUrl: "https://s3.amazonaws.com/bucket/cv.pdf",
				status: "IN_PROGRESS",
				createdAt: new Date(),
				updatedAt: new Date(),
			} as any);

		uploadFileSpy = vi
			.spyOn(S3Service.prototype, "uploadFile")
			.mockResolvedValue("https://s3.amazonaws.com/bucket/cv.pdf");

		generateFileKeySpy = vi
			.spyOn(S3Service.prototype, "generateFileKey")
			.mockReturnValue("uploads/cv-123.pdf");

		getApplicationsForUserSpy = vi
			.spyOn(ApplicationDao.prototype, "getApplicationsForUser")
			.mockResolvedValue([
				{
					applicationId: "app-1",
					userId: mockUser.userId,
					jobRoleId: "job-role-1",
					cvUrl: "https://s3.amazonaws.com/bucket/cv-1.pdf",
					status: "IN_PROGRESS",
					appliedAt: new Date(),
				},
				{
					applicationId: "app-2",
					userId: mockUser.userId,
					jobRoleId: "job-role-2",
					cvUrl: "https://s3.amazonaws.com/bucket/cv-2.pdf",
					status: "ACCEPTED",
					appliedAt: new Date(),
				},
			] as any);

		// Create Express app with routes
		const s3Service = new S3Service();
		const applicationDao = new ApplicationDao();
		const applicationService = new ApplicationService(
			applicationDao,
			s3Service,
		);
		const applicationController = new ApplicationController(applicationService);

		app = express();
		app.use(express.json());
		app.use("/api", applicationRouter(applicationController));
	});

	afterEach(() => {
		vi.restoreAllMocks();
		delete process.env.JWT_SECRET;
	});

	describe("POST /api/application", () => {
		it("should return 401 when no token is provided", async () => {
			const response = await request(app)
				.post("/api/application")
				.field("jobRoleId", "job-role-id-123");

			expect(response.status).toBe(401);
			expect(response.body).toEqual({ error: "Access token required" });
		});

		it("should return 500 when token is invalid", async () => {
			const response = await request(app)
				.post("/api/application")
				.set("Authorization", "Bearer invalid-token")
				.field("jobRoleId", "job-role-id-123");

			expect(response.status).toBe(500);
			expect(response.body).toEqual({ error: "Invalid or expired token" });
		});

		it("should return 400 when CV file is not provided", async () => {
			const response = await request(app)
				.post("/api/application")
				.set("Authorization", `Bearer ${validToken}`)
				.field("jobRoleId", "job-role-id-123");

			expect(response.status).toBe(400);
			expect(response.body).toEqual({ error: "CV file is required" });
			expect(createApplicationSpy).not.toHaveBeenCalled();
		});

		it("should return 400 when file type is invalid", async () => {
			const response = await request(app)
				.post("/api/application")
				.set("Authorization", `Bearer ${validToken}`)
				.field("jobRoleId", "job-role-id-123")
				.attach("CV", Buffer.from("fake image"), {
					filename: "test.jpg",
					contentType: "image/jpeg",
				});

			expect(response.status).toBe(400);
			expect(response.body).toHaveProperty("error");
			expect(response.body.error).toContain("Invalid file type");
			expect(createApplicationSpy).not.toHaveBeenCalled();
		});

		it("should return 400 when file extension is invalid", async () => {
			const response = await request(app)
				.post("/api/application")
				.set("Authorization", `Bearer ${validToken}`)
				.field("jobRoleId", "job-role-id-123")
				.attach("CV", Buffer.from("fake file"), {
					filename: "test.txt",
					contentType: "text/plain",
				});

			expect(response.status).toBe(400);
			expect(response.body).toHaveProperty("error");
			expect(createApplicationSpy).not.toHaveBeenCalled();
		});

		it("should return 400 when file size exceeds 10MB", async () => {
			const largeBuffer = Buffer.alloc(11 * 1024 * 1024); // 11MB

			const response = await request(app)
				.post("/api/application")
				.set("Authorization", `Bearer ${validToken}`)
				.field("jobRoleId", "job-role-id-123")
				.attach("CV", largeBuffer, {
					filename: "large-cv.pdf",
					contentType: "application/pdf",
				});

			expect(response.status).toBe(400);
			expect(response.body).toEqual({ error: "File size exceeds 10MB limit" });
			expect(createApplicationSpy).not.toHaveBeenCalled();
		});

		it("should return 201 when application is created successfully with PDF", async () => {
			const response = await request(app)
				.post("/api/application")
				.set("Authorization", `Bearer ${validToken}`)
				.field("jobRoleId", "job-role-id-123")
				.attach("CV", Buffer.from("PDF content"), {
					filename: "resume.pdf",
					contentType: "application/pdf",
				});

			expect(response.status).toBe(201);
			expect(generateFileKeySpy).toHaveBeenCalledWith(
				"resume.pdf",
				mockUser.userId,
			);
			expect(uploadFileSpy).toHaveBeenCalled();
			expect(createApplicationSpy).toHaveBeenCalledWith({
				userId: mockUser.userId,
				jobRoleId: "job-role-id-123",
				cvUrl: "https://s3.amazonaws.com/bucket/cv.pdf",
				status: "IN_PROGRESS",
			});
		});

		it("should return 201 when application is created successfully with DOCX", async () => {
			const response = await request(app)
				.post("/api/application")
				.set("Authorization", `Bearer ${validToken}`)
				.field("jobRoleId", "job-role-id-123")
				.attach("CV", Buffer.from("DOCX content"), {
					filename: "resume.docx",
					contentType:
						"application/vnd.openxmlformats-officedocument.wordprocessingml.document",
				});

			expect(response.status).toBe(201);
			expect(generateFileKeySpy).toHaveBeenCalledWith(
				"resume.docx",
				mockUser.userId,
			);
			expect(uploadFileSpy).toHaveBeenCalled();
			expect(createApplicationSpy).toHaveBeenCalled();
		});

		it("should return 201 when application is created successfully with DOC", async () => {
			const response = await request(app)
				.post("/api/application")
				.set("Authorization", `Bearer ${validToken}`)
				.field("jobRoleId", "job-role-id-123")
				.attach("CV", Buffer.from("DOC content"), {
					filename: "resume.doc",
					contentType: "application/msword",
				});

			expect(response.status).toBe(201);
			expect(generateFileKeySpy).toHaveBeenCalledWith(
				"resume.doc",
				mockUser.userId,
			);
			expect(uploadFileSpy).toHaveBeenCalled();
			expect(createApplicationSpy).toHaveBeenCalled();
		});

		it("should set userId from authenticated user token", async () => {
			const response = await request(app)
				.post("/api/application")
				.set("Authorization", `Bearer ${validToken}`)
				.field("jobRoleId", "job-role-id-123")
				.attach("CV", Buffer.from("PDF content"), {
					filename: "resume.pdf",
					contentType: "application/pdf",
				});

			expect(response.status).toBe(201);
			expect(createApplicationSpy).toHaveBeenCalledWith(
				expect.objectContaining({
					userId: mockUser.userId,
				}),
			);
		});

		it("should return 500 when service throws an error", async () => {
			uploadFileSpy.mockRejectedValueOnce(new Error("S3 upload failed"));

			const consoleErrorSpy = vi
				.spyOn(console, "error")
				.mockImplementation(() => {});

			const response = await request(app)
				.post("/api/application")
				.set("Authorization", `Bearer ${validToken}`)
				.field("jobRoleId", "job-role-id-123")
				.attach("CV", Buffer.from("PDF content"), {
					filename: "resume.pdf",
					contentType: "application/pdf",
				});

			expect(response.status).toBe(500);
			expect(consoleErrorSpy).toHaveBeenCalledWith(
				"Error creating application:",
				expect.any(Error),
			);

			consoleErrorSpy.mockRestore();
		});
	});

	describe("GET /api/myApplications", () => {
		it("should return 401 when no token is provided", async () => {
			const response = await request(app).get("/api/myApplications");

			expect(response.status).toBe(401);
			expect(response.body).toEqual({ error: "Access token required" });
			expect(getApplicationsForUserSpy).not.toHaveBeenCalled();
		});

		it("should return 500 when token is invalid", async () => {
			const response = await request(app)
				.get("/api/myApplications")
				.set("Authorization", "Bearer invalid-token");

			expect(response.status).toBe(500);
			expect(response.body).toEqual({ error: "Invalid or expired token" });
			expect(getApplicationsForUserSpy).not.toHaveBeenCalled();
		});

		it("should return applications with 200 status for valid token", async () => {
			const response = await request(app)
				.get("/api/myApplications")
				.set("Authorization", `Bearer ${validToken}`);

			expect(response.status).toBe(200);
			expect(response.body).toHaveLength(2);
			expect(response.body[0]).toEqual(
				expect.objectContaining({
					applicationId: "app-1",
					userId: mockUser.userId,
					jobRoleId: "job-role-1",
				}),
			);
			expect(getApplicationsForUserSpy).toHaveBeenCalledWith(mockUser.userId);
		});

		it("should return empty array when user has no applications", async () => {
			getApplicationsForUserSpy.mockResolvedValue([]);

			const response = await request(app)
				.get("/api/myApplications")
				.set("Authorization", `Bearer ${validToken}`);

			expect(response.status).toBe(200);
			expect(response.body).toEqual([]);
			expect(getApplicationsForUserSpy).toHaveBeenCalledWith(mockUser.userId);
		});

		it("should return 500 when service throws an error", async () => {
			const consoleErrorSpy = vi
				.spyOn(console, "error")
				.mockImplementation(() => {});

			getApplicationsForUserSpy.mockRejectedValueOnce(
				new Error("Database error"),
			);

			const response = await request(app)
				.get("/api/myApplications")
				.set("Authorization", `Bearer ${validToken}`);

			expect(response.status).toBe(500);
			expect(consoleErrorSpy).toHaveBeenCalledWith(
				"Error fetching applications for user:",
				expect.any(Error),
			);

			consoleErrorSpy.mockRestore();
		});

		it("should only return applications for authenticated user", async () => {
			const response = await request(app)
				.get("/api/myApplications")
				.set("Authorization", `Bearer ${validToken}`);

			expect(response.status).toBe(200);
			expect(getApplicationsForUserSpy).toHaveBeenCalledWith(mockUser.userId);
			response.body.forEach((app: any) => {
				expect(app.userId).toBe(mockUser.userId);
			});
		});
	});
});

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
	let adminToken: string;
	let createApplicationSpy: ReturnType<typeof vi.spyOn>;
	let uploadFileSpy: ReturnType<typeof vi.spyOn>;
	let generateFileKeySpy: ReturnType<typeof vi.spyOn>;
	let getApplicationsForUserSpy: ReturnType<typeof vi.spyOn>;
	let getApplicationsByJobRoleIdSpy: ReturnType<typeof vi.spyOn>;
	let updateApplicationStatusSpy: ReturnType<typeof vi.spyOn>;

	const mockUser = {
		userId: "550e8400-e29b-41d4-a716-446655440000",
		email: "test@example.com",
		firstName: "Test",
		secondName: "User",
		role: "user",
	};

	const mockAdmin = {
		userId: "admin-550e8400-e29b-41d4-a716-446655440001",
		email: "admin@example.com",
		firstName: "Admin",
		secondName: "User",
		role: "admin",
	};

	beforeEach(() => {
		// Set up JWT secret and generate valid tokens
		process.env.JWT_SECRET = "test-secret-key";
		validToken = jwt.sign(mockUser, process.env.JWT_SECRET, {
			expiresIn: "1h",
		});
		adminToken = jwt.sign(mockAdmin, process.env.JWT_SECRET, {
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

		getApplicationsByJobRoleIdSpy = vi
			.spyOn(ApplicationDao.prototype, "getApplicationsByJobRoleId")
			.mockResolvedValue([
				{
					applicationId: "app-1",
					userId: "user-1",
					jobRoleId: "job-role-123",
					cvUrl: "https://s3.amazonaws.com/bucket/cv-1.pdf",
					status: "IN_PROGRESS",
					appliedAt: new Date(),
				},
				{
					applicationId: "app-2",
					userId: "user-2",
					jobRoleId: "job-role-123",
					cvUrl: "https://s3.amazonaws.com/bucket/cv-2.pdf",
					status: "HIRED",
					appliedAt: new Date(),
				},
			] as any);

		updateApplicationStatusSpy = vi
			.spyOn(ApplicationDao.prototype, "updateApplicationStatus")
			.mockResolvedValue(undefined as any);

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

	describe("GET /api/admin/job-roles/:jobRoleId", () => {
		it("should return 401 when no token is provided", async () => {
			const response = await request(app).get(
				"/api/admin/job-roles/job-role-123",
			);

			expect(response.status).toBe(401);
			expect(response.body).toEqual({ error: "Access token required" });
			expect(getApplicationsByJobRoleIdSpy).not.toHaveBeenCalled();
		});

		it("should return 500 when token is invalid", async () => {
			const response = await request(app)
				.get("/api/admin/job-roles/job-role-123")
				.set("Authorization", "Bearer invalid-token");

			expect(response.status).toBe(500);
			expect(response.body).toEqual({ error: "Invalid or expired token" });
			expect(getApplicationsByJobRoleIdSpy).not.toHaveBeenCalled();
		});

		it("should return 403 when user role is not admin", async () => {
			const response = await request(app)
				.get("/api/admin/job-roles/job-role-123")
				.set("Authorization", `Bearer ${validToken}`);

			expect(response.status).toBe(403);
			expect(getApplicationsByJobRoleIdSpy).not.toHaveBeenCalled();
		});

		it("should return applications for job role with 200 status for admin", async () => {
			const response = await request(app)
				.get("/api/admin/job-roles/job-role-123")
				.set("Authorization", `Bearer ${adminToken}`);

			expect(response.status).toBe(200);
			expect(response.body).toHaveLength(2);
			expect(response.body[0]).toEqual(
				expect.objectContaining({
					applicationId: "app-1",
					jobRoleId: "job-role-123",
				}),
			);
			expect(getApplicationsByJobRoleIdSpy).toHaveBeenCalledWith(
				"job-role-123",
			);
		});

		it("should return empty array when no applications exist for job role", async () => {
			getApplicationsByJobRoleIdSpy.mockResolvedValue([]);

			const response = await request(app)
				.get("/api/admin/job-roles/job-role-999")
				.set("Authorization", `Bearer ${adminToken}`);

			expect(response.status).toBe(200);
			expect(response.body).toEqual([]);
			expect(getApplicationsByJobRoleIdSpy).toHaveBeenCalledWith(
				"job-role-999",
			);
		});

		it("should handle different jobRoleId parameter correctly", async () => {
			const specificJobRoleId = "unique-job-role-456";

			const response = await request(app)
				.get(`/api/admin/job-roles/${specificJobRoleId}`)
				.set("Authorization", `Bearer ${adminToken}`);

			expect(response.status).toBe(200);
			expect(getApplicationsByJobRoleIdSpy).toHaveBeenCalledWith(
				specificJobRoleId,
			);
		});

		it("should return 500 when service throws an error", async () => {
			const consoleErrorSpy = vi
				.spyOn(console, "error")
				.mockImplementation(() => {});

			getApplicationsByJobRoleIdSpy.mockRejectedValueOnce(
				new Error("Database error"),
			);

			const response = await request(app)
				.get("/api/admin/job-roles/job-role-123")
				.set("Authorization", `Bearer ${adminToken}`);

			expect(response.status).toBe(500);
			expect(consoleErrorSpy).toHaveBeenCalledWith(
				"Error fetching applications for job role:",
				expect.any(Error),
			);

			consoleErrorSpy.mockRestore();
		});
	});

	describe("PUT /api/admin/application/:applicationId/:status", () => {
		it("should return 401 when no token is provided", async () => {
			const response = await request(app).put(
				"/api/admin/application/app-123/HIRED",
			);

			expect(response.status).toBe(401);
			expect(response.body).toEqual({ error: "Access token required" });
			expect(updateApplicationStatusSpy).not.toHaveBeenCalled();
		});

		it("should return 500 when token is invalid", async () => {
			const response = await request(app)
				.put("/api/admin/application/app-123/HIRED")
				.set("Authorization", "Bearer invalid-token");

			expect(response.status).toBe(500);
			expect(response.body).toEqual({ error: "Invalid or expired token" });
			expect(updateApplicationStatusSpy).not.toHaveBeenCalled();
		});

		it("should return 403 when user role is not admin", async () => {
			const response = await request(app)
				.put("/api/admin/application/app-123/HIRED")
				.set("Authorization", `Bearer ${validToken}`);

			expect(response.status).toBe(403);
			expect(updateApplicationStatusSpy).not.toHaveBeenCalled();
		});

		it("should update application status to HIRED with 200 status for admin", async () => {
			const consoleLogSpy = vi
				.spyOn(console, "log")
				.mockImplementation(() => {});

			const response = await request(app)
				.put("/api/admin/application/app-123/HIRED")
				.set("Authorization", `Bearer ${adminToken}`);

			expect(response.status).toBe(200);
			expect(updateApplicationStatusSpy).toHaveBeenCalledWith(
				"app-123",
				"HIRED",
			);

			consoleLogSpy.mockRestore();
		});

		it("should update application status to REJECTED", async () => {
			const consoleLogSpy = vi
				.spyOn(console, "log")
				.mockImplementation(() => {});

			const response = await request(app)
				.put("/api/admin/application/app-456/REJECTED")
				.set("Authorization", `Bearer ${adminToken}`);

			expect(response.status).toBe(200);
			expect(updateApplicationStatusSpy).toHaveBeenCalledWith(
				"app-456",
				"REJECTED",
			);

			consoleLogSpy.mockRestore();
		});

		it("should update application status to IN_PROGRESS", async () => {
			const consoleLogSpy = vi
				.spyOn(console, "log")
				.mockImplementation(() => {});

			const response = await request(app)
				.put("/api/admin/application/app-789/IN_PROGRESS")
				.set("Authorization", `Bearer ${adminToken}`);

			expect(response.status).toBe(200);
			expect(updateApplicationStatusSpy).toHaveBeenCalledWith(
				"app-789",
				"IN_PROGRESS",
			);

			consoleLogSpy.mockRestore();
		});

		it("should handle different applicationId and status parameters correctly", async () => {
			const consoleLogSpy = vi
				.spyOn(console, "log")
				.mockImplementation(() => {});

			const specificAppId = "unique-app-id-999";
			const specificStatus = "HIRED";

			const response = await request(app)
				.put(`/api/admin/application/${specificAppId}/${specificStatus}`)
				.set("Authorization", `Bearer ${adminToken}`);

			expect(response.status).toBe(200);
			expect(updateApplicationStatusSpy).toHaveBeenCalledWith(
				specificAppId,
				specificStatus,
			);

			consoleLogSpy.mockRestore();
		});

		it("should return 500 when service throws an error", async () => {
			const consoleErrorSpy = vi
				.spyOn(console, "error")
				.mockImplementation(() => {});
			const consoleLogSpy = vi
				.spyOn(console, "log")
				.mockImplementation(() => {});

			updateApplicationStatusSpy.mockRejectedValueOnce(
				new Error("Database error"),
			);

			const response = await request(app)
				.put("/api/admin/application/app-123/HIRED")
				.set("Authorization", `Bearer ${adminToken}`);

			expect(response.status).toBe(500);
			expect(consoleErrorSpy).toHaveBeenCalledWith(
				"Error updating application status:",
				expect.any(Error),
			);

			consoleErrorSpy.mockRestore();
			consoleLogSpy.mockRestore();
		});
	});
});

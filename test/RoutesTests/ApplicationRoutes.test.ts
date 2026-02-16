import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import express from "express";
import request from "supertest";
import { ApplicationDao } from "../../src/daos/application.dao.js";
import { S3Service } from "../../src/services/s3.service.js";
import applicationRouter from "../../src/routes/application.routes.js";

vi.mock("../../src/services/s3.service.js");

describe("Application Routes - Integration Tests", () => {
	let getAllApplicationsSpy: ReturnType<typeof vi.spyOn>;
	let getApplicationByIdSpy: ReturnType<typeof vi.spyOn>;
	let createApplicationSpy: ReturnType<typeof vi.spyOn>;
	let updateApplicationSpy: ReturnType<typeof vi.spyOn>;
	let deleteApplicationSpy: ReturnType<typeof vi.spyOn>;
	let getAllApplicationsForUserSpy: ReturnType<typeof vi.spyOn>;

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

	const expectedResponse = [
		{
			applicationId: "app-123",
			userId: "user-123",
			jobRoleId: "role-123",
			status: "applied",
			appliedAt: "2026-02-16T00:00:00.000Z",
			cvUrl: "https://example.com/cv.pdf",
		},
		{
			applicationId: "app-456",
			userId: "user-456",
			jobRoleId: "role-456",
			status: "accepted",
			appliedAt: "2026-02-15T00:00:00.000Z",
			cvUrl: "https://example.com/cv2.pdf",
		},
	];

	const expectedSingleResponse = expectedResponse[0];

	beforeEach(() => {
		// Set up environment variable for S3Service
		process.env.AWS_S3_BUCKET_NAME = "test-bucket";
		process.env.AWS_REGION = "us-east-1";

		// Mock S3Service methods
		vi.mocked(S3Service).prototype.generateFileKey = vi
			.fn()
			.mockReturnValue("applications/temp-123/1739723400000_resume.pdf");
		vi.mocked(S3Service).prototype.uploadFile = vi
			.fn()
			.mockResolvedValue(
				"https://bucket.s3.us-east-1.amazonaws.com/applications/temp-123/1739723400000_resume.pdf",
			);

		getAllApplicationsSpy = vi
			.spyOn(ApplicationDao.prototype, "getAllApplications")
			.mockResolvedValue(mockApplications);

		getApplicationByIdSpy = vi
			.spyOn(ApplicationDao.prototype, "getApplicationById")
			.mockResolvedValue(mockApplication);

		createApplicationSpy = vi
			.spyOn(ApplicationDao.prototype, "createApplication")
			.mockResolvedValue(mockApplication);

		updateApplicationSpy = vi
			.spyOn(ApplicationDao.prototype, "updateApplication")
			.mockResolvedValue(mockApplication);

		deleteApplicationSpy = vi
			.spyOn(ApplicationDao.prototype, "deleteApplication")
			.mockResolvedValue(mockApplication);

		getAllApplicationsForUserSpy = vi
			.spyOn(ApplicationDao.prototype, "getAllApplicationsForUser")
			.mockResolvedValue([mockApplication]);
	});

	afterEach(() => {
		vi.restoreAllMocks();
		delete process.env.AWS_S3_BUCKET_NAME;
		delete process.env.AWS_REGION;
	});

	const buildApp = () => {
		const app = express();
		app.use(express.json());
		app.use(applicationRouter);
		return app;
	};

	describe("GET /adminApplications", () => {
		it("should return 200 with all applications", async () => {
			const app = buildApp();

			const response = await request(app).get("/adminApplications");

			expect(response.status).toBe(200);
			expect(response.body).toEqual(expectedResponse);
			expect(getAllApplicationsSpy).toHaveBeenCalledTimes(1);
		});

		it("should return 200 with empty array when no applications exist", async () => {
			getAllApplicationsSpy.mockResolvedValueOnce([]);
			const app = buildApp();

			const response = await request(app).get("/adminApplications");

			expect(response.status).toBe(200);
			expect(response.body).toEqual([]);
		});

		it("should return 500 when DAO throws error", async () => {
			getAllApplicationsSpy.mockRejectedValueOnce(new Error("Database error"));
			const app = buildApp();

			const response = await request(app).get("/adminApplications");

			expect(response.status).toBe(500);
		});
	});

	describe("GET /adminApplications/:id", () => {
		it("should return 200 with application when found", async () => {
			const app = buildApp();

			const response = await request(app).get("/adminApplications/app-123");

			expect(response.status).toBe(200);
			expect(response.body).toEqual(expectedSingleResponse);
			expect(getApplicationByIdSpy).toHaveBeenCalledWith("app-123");
		});

		it("should return 404 when application not found", async () => {
			getApplicationByIdSpy.mockResolvedValueOnce(null);
			const app = buildApp();

			const response = await request(app).get(
				"/adminApplications/non-existent",
			);

			expect(response.status).toBe(404);
		});

		it("should return 500 when DAO throws error", async () => {
			getApplicationByIdSpy.mockRejectedValueOnce(new Error("Database error"));
			const app = buildApp();

			const response = await request(app).get("/adminApplications/app-123");

			expect(response.status).toBe(500);
		});
	});

	describe("PUT /adminApplications/:id", () => {
		it("should return 200 with updated application", async () => {
			const app = buildApp();
			const updateData = { status: "accepted" };

			const response = await request(app)
				.put("/adminApplications/app-123")
				.send(updateData);

			expect(response.status).toBe(200);
			expect(response.body).toEqual(expectedSingleResponse);
			expect(updateApplicationSpy).toHaveBeenCalledWith("app-123", updateData);
		});

		it("should return 500 when DAO throws error", async () => {
			updateApplicationSpy.mockRejectedValueOnce(new Error("Database error"));
			const app = buildApp();

			const response = await request(app)
				.put("/adminApplications/app-123")
				.send({ status: "rejected" });

			expect(response.status).toBe(500);
		});
	});

	describe("DELETE /adminApplications/:id", () => {
		it("should return 204 on successful deletion", async () => {
			const app = buildApp();

			const response = await request(app).delete("/adminApplications/app-123");

			expect(response.status).toBe(204);
			expect(deleteApplicationSpy).toHaveBeenCalledWith("app-123");
		});

		it("should return 500 when DAO throws error", async () => {
			deleteApplicationSpy.mockRejectedValueOnce(new Error("Database error"));
			const app = buildApp();

			const response = await request(app).delete("/adminApplications/app-123");

			expect(response.status).toBe(500);
		});
	});

	describe("POST /createApplication", () => {
		it("should return 201 with created application", async () => {
			const app = buildApp();

			const response = await request(app)
				.post("/createApplication")
				.field("userId", "user-123")
				.field("jobRoleId", "role-123")
				.attach("CV", Buffer.from("PDF content"), "resume.pdf");

			expect(response.status).toBe(201);
			expect(response.body).toEqual(expectedSingleResponse);
		});

		it("should return 400 when file is missing", async () => {
			const app = buildApp();

			const response = await request(app)
				.post("/createApplication")
				.field("userId", "user-123")
				.field("jobRoleId", "role-123");

			expect(response.status).toBe(400);
			expect(response.body).toEqual({ error: "CV file is required" });
		});

		it("should return 500 when DAO throws error", async () => {
			createApplicationSpy.mockRejectedValueOnce(new Error("Database error"));
			const app = buildApp();

			const response = await request(app)
				.post("/createApplication")
				.field("userId", "user-123")
				.field("jobRoleId", "role-123")
				.attach("CV", Buffer.from("PDF content"), "resume.pdf");

			expect(response.status).toBe(500);
		});
	});

	describe("GET /myapplications/:userId", () => {
		it("should return 200 with user applications", async () => {
			const app = buildApp();

			const response = await request(app).get("/myapplications/user-123");

			expect(response.status).toBe(200);
			expect(response.body).toEqual([expectedSingleResponse]);
			expect(getAllApplicationsForUserSpy).toHaveBeenCalledWith("user-123");
		});

		it("should return 200 with empty array when user has no applications", async () => {
			getAllApplicationsForUserSpy.mockResolvedValueOnce([]);
			const app = buildApp();

			const response = await request(app).get("/myapplications/user-no-apps");

			expect(response.status).toBe(200);
			expect(response.body).toEqual([]);
		});

		it("should return 500 when DAO throws error", async () => {
			getAllApplicationsForUserSpy.mockRejectedValueOnce(
				new Error("Database error"),
			);
			const app = buildApp();

			const response = await request(app).get("/myapplications/user-123");

			expect(response.status).toBe(500);
		});
	});

	describe("GET /myapplications/application/:id", () => {
		it("should return 200 with application when found", async () => {
			const app = buildApp();

			const response = await request(app).get(
				"/myapplications/application/app-123",
			);

			expect(response.status).toBe(200);
			expect(response.body).toEqual(expectedSingleResponse);
		});

		it("should return 404 when application not found", async () => {
			getApplicationByIdSpy.mockResolvedValueOnce(null);
			const app = buildApp();

			const response = await request(app).get(
				"/myapplications/application/non-existent",
			);

			expect(response.status).toBe(404);
		});

		it("should return 500 when DAO throws error", async () => {
			getApplicationByIdSpy.mockRejectedValueOnce(new Error("Database error"));
			const app = buildApp();

			const response = await request(app).get(
				"/myapplications/application/app-123",
			);

			expect(response.status).toBe(500);
		});
	});

	describe("DELETE /myapplications/application/:id", () => {
		it("should return 204 on successful deletion", async () => {
			const app = buildApp();

			const response = await request(app).delete(
				"/myapplications/application/app-123",
			);

			expect(response.status).toBe(204);
			expect(deleteApplicationSpy).toHaveBeenCalledWith("app-123");
		});

		it("should return 500 when DAO throws error", async () => {
			deleteApplicationSpy.mockRejectedValueOnce(new Error("Database error"));
			const app = buildApp();

			const response = await request(app).delete(
				"/myapplications/application/app-123",
			);

			expect(response.status).toBe(500);
		});
	});
});

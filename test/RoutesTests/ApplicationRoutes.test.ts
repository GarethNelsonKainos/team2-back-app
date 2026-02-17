import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import express from "express";
import request from "supertest";
import jwt from "jsonwebtoken";
import { ApplicationDao } from "../../src/daos/application.dao.js";
import { S3Service } from "../../src/services/s3.service.js";
import applicationRouter from "../../src/routes/application.routes.js";

vi.mock("../../src/services/s3.service.js");

describe("Application Routes - Integration Tests", () => {
	let createApplicationSpy: ReturnType<typeof vi.spyOn>;

	const mockApplication = {
		applicationId: "app-123",
		userId: "user-123",
		jobRoleId: "role-123",
		status: "applied",
		appliedAt: new Date("2026-02-16"),
		cvUrl: "https://example.com/cv.pdf",
	};

	const expectedSingleResponse = {
		applicationId: "app-123",
		userId: "user-123",
		jobRoleId: "role-123",
		status: "applied",
		appliedAt: "2026-02-16T00:00:00.000Z",
		cvUrl: "https://example.com/cv.pdf",
	};

	const buildAuthHeader = () => {
		const secret = process.env.JWT_SECRET ?? "test-secret-key";
		const token = jwt.sign(
			{
				userId: "user-123",
				firstName: "Test",
				secondName: "User",
				email: "user@test.com",
				role: "user",
			},
			secret,
		);
		return `Bearer ${token}`;
	};

	beforeEach(() => {
		process.env.S3_BUCKET_NAME = "test-bucket";
		process.env.AWS_REGION = "us-east-1";
		process.env.JWT_SECRET = "test-secret-key";

		vi.mocked(S3Service).prototype.generateFileKey = vi
			.fn()
			.mockReturnValue("applications/temp-123/1739723400000_resume.pdf");
		vi.mocked(S3Service).prototype.uploadFile = vi
			.fn()
			.mockResolvedValue(
				"https://bucket.s3.us-east-1.amazonaws.com/applications/temp-123/1739723400000_resume.pdf",
			);

		createApplicationSpy = vi
			.spyOn(ApplicationDao.prototype, "createApplication")
			.mockResolvedValue(mockApplication);
	});

	afterEach(() => {
		vi.restoreAllMocks();
		delete process.env.S3_BUCKET_NAME;
		delete process.env.AWS_REGION;
		delete process.env.JWT_SECRET;
	});

	const buildApp = () => {
		const app = express();
		app.use(express.json());
		app.use(applicationRouter);
		return app;
	};

	describe("POST /application", () => {
		it("should return 401 when token is missing", async () => {
			const app = buildApp();

			const response = await request(app)
				.post("/application")
				.field("userId", "user-123")
				.field("jobRoleId", "role-123")
				.attach("CV", Buffer.from("PDF content"), "resume.pdf");

			expect(response.status).toBe(401);
			expect(response.body).toEqual({ error: "Access token required" });
		});

		it("should return 201 with created application", async () => {
			const app = buildApp();

			const response = await request(app)
				.post("/application")
				.set("Authorization", buildAuthHeader())
				.field("userId", "user-123")
				.field("jobRoleId", "role-123")
				.attach("CV", Buffer.from("PDF content"), "resume.pdf");

			expect(response.status).toBe(201);
			expect(response.body).toEqual(expectedSingleResponse);
		});

		it("should return 400 when file is missing", async () => {
			const app = buildApp();

			const response = await request(app)
				.post("/application")
				.set("Authorization", buildAuthHeader())
				.field("userId", "user-123")
				.field("jobRoleId", "role-123");

			expect(response.status).toBe(400);
			expect(response.body).toEqual({ error: "CV file is required" });
		});

		it("should return 500 when DAO throws error", async () => {
			createApplicationSpy.mockRejectedValueOnce(new Error("Database error"));
			const app = buildApp();

			const response = await request(app)
				.post("/application")
				.set("Authorization", buildAuthHeader())
				.field("userId", "user-123")
				.field("jobRoleId", "role-123")
				.attach("CV", Buffer.from("PDF content"), "resume.pdf");

			expect(response.status).toBe(500);
		});

		it("should return 400 for invalid MIME type", async () => {
			const app = buildApp();

			const response = await request(app)
				.post("/application")
				.set("Authorization", buildAuthHeader())
				.field("userId", "user-123")
				.field("jobRoleId", "role-123")
				.attach("CV", Buffer.from("PNG content"), {
					filename: "resume.png",
					contentType: "image/png",
				});

			expect(response.status).toBe(400);
			expect(response.body).toEqual({
				error:
					"Invalid file type. Only .doc, .docx, and .pdf files are allowed.",
			});
		});

		it("should return 400 for invalid file extension", async () => {
			const app = buildApp();

			const response = await request(app)
				.post("/application")
				.set("Authorization", buildAuthHeader())
				.field("userId", "user-123")
				.field("jobRoleId", "role-123")
				.attach("CV", Buffer.from("PDF content"), {
					filename: "resume.txt",
					contentType: "application/pdf",
				});

			expect(response.status).toBe(400);
			expect(response.body).toEqual({
				error:
					"Invalid file extension. Only .doc, .docx, and .pdf files are allowed.",
			});
		});

		it("should return 400 for files exceeding size limit", async () => {
			const app = buildApp();
			const oversizedFile = Buffer.alloc(10 * 1024 * 1024 + 1, 0);

			const response = await request(app)
				.post("/application")
				.set("Authorization", buildAuthHeader())
				.field("userId", "user-123")
				.field("jobRoleId", "role-123")
				.attach("CV", oversizedFile, "resume.pdf");

			expect(response.status).toBe(400);
			expect(response.body).toEqual({
				error: "File size exceeds 10MB limit",
			});
		});
	});
});

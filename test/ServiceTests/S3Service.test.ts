import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { S3Service } from "../../src/services/s3.service.js";
import type { Express } from "express";

// Mock AWS SDK v3
const mockSend = vi.fn();
const mockPutObjectCommandInstance: any = {};

vi.mock("@aws-sdk/client-s3", () => ({
	S3Client: class MockS3Client {
		send = mockSend;
	},
	PutObjectCommand: class MockPutObjectCommand {
		constructor(public params: any) {
			Object.assign(mockPutObjectCommandInstance, params);
		}
	},
}));

describe("S3Service", () => {
	let s3Service: S3Service;

	const mockFile: Express.Multer.File = {
		fieldname: "CV",
		originalname: "resume.pdf",
		encoding: "7bit",
		mimetype: "application/pdf",
		size: 1024,
		destination: "",
		filename: "",
		path: "",
		buffer: Buffer.from("fake pdf content"),
		stream: {} as any,
	};

	beforeEach(() => {
		// Reset environment variables
		process.env.S3_BUCKET_NAME = "test-bucket";
		process.env.AWS_REGION = "us-east-1";
		process.env.AWS_ACCESS_KEY_ID = "test-access-key-id";
		process.env.AWS_SECRET_ACCESS_KEY = "test-secret-access-key";

		// Reset mocks
		vi.clearAllMocks();
		mockSend.mockResolvedValue({});
		// Clear the mock instance
		Object.keys(mockPutObjectCommandInstance).forEach((key) => {
			delete mockPutObjectCommandInstance[key];
		});

		s3Service = new S3Service();
	});

	afterEach(() => {
		vi.clearAllMocks();
		delete process.env.S3_BUCKET_NAME;
		delete process.env.AWS_REGION;
		delete process.env.AWS_ACCESS_KEY_ID;
		delete process.env.AWS_SECRET_ACCESS_KEY;
	});

	describe("constructor", () => {
		it("should throw error when S3_BUCKET_NAME is not set", () => {
			delete process.env.S3_BUCKET_NAME;
			process.env.AWS_ACCESS_KEY_ID = "test-access-key-id";
			process.env.AWS_SECRET_ACCESS_KEY = "test-secret-access-key";
			vi.clearAllMocks();

			expect(() => {
				new S3Service();
			}).toThrow("S3_BUCKET_NAME environment variable is not set");
		});

		it("should throw error when AWS credentials are not set", () => {
			process.env.S3_BUCKET_NAME = "test-bucket";
			delete process.env.AWS_ACCESS_KEY_ID;
			delete process.env.AWS_SECRET_ACCESS_KEY;
			vi.clearAllMocks();

			expect(() => {
				new S3Service();
			}).toThrow(
				"AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY environment variables must be set",
			);
		});

		it("should initialize with default AWS region", () => {
			process.env.S3_BUCKET_NAME = "test-bucket";
			process.env.AWS_ACCESS_KEY_ID = "test-access-key-id";
			process.env.AWS_SECRET_ACCESS_KEY = "test-secret-access-key";
			delete process.env.AWS_REGION;
			vi.clearAllMocks();

			s3Service = new S3Service();

			// Verify it was initialized (it won't error, which is the test)
			expect(s3Service).toBeDefined();
		});

		it("should initialize with custom AWS region", () => {
			process.env.S3_BUCKET_NAME = "test-bucket";
			process.env.AWS_REGION = "eu-west-1";
			process.env.AWS_ACCESS_KEY_ID = "test-access-key-id";
			process.env.AWS_SECRET_ACCESS_KEY = "test-secret-access-key";
			vi.clearAllMocks();

			s3Service = new S3Service();

			expect(s3Service).toBeDefined();
		});
	});

	describe("uploadFile", () => {
		it("should successfully upload file to S3", async () => {
			const fileKey = "applications/app-123/1234567890_resume.pdf";

			const result = await s3Service.uploadFile(mockFile, fileKey);

			expect(mockSend).toHaveBeenCalledTimes(1);
			expect(mockPutObjectCommandInstance).toEqual({
				Bucket: "test-bucket",
				Key: fileKey,
				Body: mockFile.buffer,
				ContentType: mockFile.mimetype,
			});
			expect(result).toBe(
				"https://test-bucket.s3.us-east-1.amazonaws.com/applications/app-123/1234567890_resume.pdf",
			);
		});

		it("should throw error when file is not provided", async () => {
			const fileKey = "applications/app-123/1234567890_resume.pdf";

			await expect(s3Service.uploadFile(null as any, fileKey)).rejects.toThrow(
				"No file provided",
			);

			expect(mockSend).not.toHaveBeenCalled();
		});

		it("should handle S3 upload errors", async () => {
			const fileKey = "applications/app-123/resume.pdf";
			const s3Error = new Error("S3 service unavailable");
			mockSend.mockRejectedValueOnce(s3Error);

			await expect(s3Service.uploadFile(mockFile, fileKey)).rejects.toThrow(
				"Failed to upload file to S3",
			);
		});

		it("should handle different AWS regions in URL", async () => {
			process.env.AWS_REGION = "eu-west-1";
			process.env.AWS_ACCESS_KEY_ID = "test-access-key-id";
			process.env.AWS_SECRET_ACCESS_KEY = "test-secret-access-key";
			vi.clearAllMocks();
			mockSend.mockResolvedValue({});

			s3Service = new S3Service();

			const fileKey = "applications/app-123/resume.pdf";
			const result = await s3Service.uploadFile(mockFile, fileKey);

			expect(result).toBe(
				"https://test-bucket.s3.eu-west-1.amazonaws.com/applications/app-123/resume.pdf",
			);
		});
	});

	describe("generateFileKey", () => {
		it("should generate file key with applicationId", () => {
			const filename = "resume.pdf";
			const appId = "app-123";

			const key = s3Service.generateFileKey(filename, appId);

			expect(key).toMatch(/^applications\/app-123\/\d+_resume\.pdf$/);
		});

		it("should generate file key without applicationId", () => {
			const filename = "resume.pdf";

			const key = s3Service.generateFileKey(filename);

			expect(key).toMatch(/^applications\/temp-\d+\/\d+_resume\.pdf$/);
		});

		it("should sanitize filename with spaces", () => {
			const filename = "my resume.pdf";
			const appId = "app-123";

			const key = s3Service.generateFileKey(filename, appId);

			expect(key).toMatch(/^applications\/app-123\/\d+_my_resume\.pdf$/);
		});

		it("should sanitize filename with multiple spaces", () => {
			const filename = "my   resume   file.pdf";
			const appId = "app-123";

			const key = s3Service.generateFileKey(filename, appId);

			expect(key).toMatch(/^applications\/app-123\/\d+_my_resume_file\.pdf$/);
		});
	});
});

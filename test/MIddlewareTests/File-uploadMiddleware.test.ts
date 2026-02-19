import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Request, Response, NextFunction } from "express";
import { fileFilter } from "../../src/middleware/file-upload.middleware.js";

describe("File Upload Middleware", () => {
	let _mockRequest: Partial<Request>;
	let _mockResponse: Partial<Response>;
	let _mockNextFunction: NextFunction;

	beforeEach(() => {
		_mockRequest = {
			file: undefined,
		};
		_mockResponse = {
			status: vi.fn().mockReturnThis(),
			json: vi.fn().mockReturnThis(),
		};
		_mockNextFunction = vi.fn();
	});

	describe("upload.single('CV')", () => {
		it("should reject files with invalid extension", () => {
			const mockFile: Express.Multer.File = {
				fieldname: "CV",
				originalname: "resume.txt",
				encoding: "7bit",
				mimetype: "application/pdf",
				size: 1024,
				destination: "",
				filename: "",
				path: "",
				buffer: Buffer.from("fake content"),
				stream: {} as any,
			};

			const mockReq = {} as Request;

			fileFilter(
				mockReq,
				mockFile,
				(error: Error | null, acceptFile?: boolean): void => {
					expect(error).toBeDefined();
					expect(error?.message).toBe(
						"Invalid file extension. Only .doc, .docx, and .pdf files are allowed.",
					);
					expect(acceptFile).toBeUndefined();
				},
			);
		});

		it("should reject files with invalid MIME type", () => {
			const mockFile: Express.Multer.File = {
				fieldname: "CV",
				originalname: "image.png",
				encoding: "7bit",
				mimetype: "image/png",
				size: 1024,
				destination: "",
				filename: "",
				path: "",
				buffer: Buffer.from("fake png content"),
				stream: {} as any,
			};

			const mockReq = {} as Request;

			fileFilter(
				mockReq,
				mockFile,
				(error: Error | null, acceptFile?: boolean): void => {
					expect(error).toBeDefined();
					expect(error?.message).toBe(
						"Invalid file type. Only .doc, .docx, and .pdf files are allowed.",
					);
					expect(acceptFile).toBeUndefined();
				},
			);
		});

		it("should accept valid PDF files", () => {
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

			const mockReq = {} as Request;

			fileFilter(
				mockReq,
				mockFile,
				(error: Error | null, acceptFile?: boolean): void => {
					expect(error).toBeNull();
					expect(acceptFile).toBe(true);
				},
			);
		});
	});
});

import multer from "multer";
import type { Request } from "express";

// Allowed file types
const ALLOWED_MIMETYPES = [
	"application/msword", // .doc
	"application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
	"application/pdf", // .pdf
];

const ALLOWED_EXTENSIONS = [".doc", ".docx", ".pdf"];

// Configure multer storage (store in memory)
const storage = multer.memoryStorage();

// File filter to validate file type
const fileFilter = (
	_req: Request,
	file: Express.Multer.File,
	cb: multer.FileFilterCallback,
) => {
	// Check MIME type
	if (!ALLOWED_MIMETYPES.includes(file.mimetype)) {
		return cb(
			new Error(
				"Invalid file type. Only .doc, .docx, and .pdf files are allowed.",
			),
		);
	}

	// Check file extension
	const filename = file.originalname.toLowerCase();
	const hasValidExtension = ALLOWED_EXTENSIONS.some((ext) =>
		filename.endsWith(ext),
	);

	if (!hasValidExtension) {
		return cb(
			new Error(
				"Invalid file extension. Only .doc, .docx, and .pdf files are allowed.",
			),
		);
	}

	cb(null, true);
};

// Create multer instance
export const upload = multer({
	storage,
	fileFilter,
	limits: {
		fileSize: 10 * 1024 * 1024, // 10MB max file size
	},
});

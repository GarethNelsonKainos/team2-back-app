import multer from "multer";
import express from "express";

const ALLOWED_MIMETYPES = [
	"application/msword", // .doc
	"application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
	"application/pdf", // .pdf
];

const ALLOWED_EXTENSIONS = [".doc", ".docx", ".pdf"];

const storage = multer.memoryStorage();

// File filter to validate file type and size
const fileFilter = (
	_req: express.Request,
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

export const handleUpload = (
	req: express.Request,
	res: express.Response,
	next: express.NextFunction,
): void => {
	uploadSingle(req, res, (error) => {
		if (!error) {
			next();
			return;
		}

		if (error instanceof multer.MulterError) {
			if (error.code === "LIMIT_FILE_SIZE") {
				res.status(400).json({ error: "File size exceeds 10MB limit" });
				return;
			}
			res.status(400).json({ error: error.message });
			return;
		}

		res.status(400).json({
			error: error instanceof Error ? error.message : "Upload failed",
		});
	});
};

// Create multer instance
export const upload = multer({
	storage,
	fileFilter,
	limits: {
		fileSize: 10 * 1024 * 1024, // 10MB max file size
	},
});

const uploadSingle = upload.single("CV");

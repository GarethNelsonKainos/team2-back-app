import express, { type Router } from "express";
import multer from "multer";
import { ApplicationController } from "../controllers/application.controller.js";
import { upload } from "../middleware/file-upload.middleware.js";
import { authenticateToken } from "../middleware/auth.middleware.js";

const router: Router = express.Router();
const applicationController = new ApplicationController();
const uploadSingle = upload.single("CV");

const handleUpload = (
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

		res
			.status(400)
			.json({
				error: error instanceof Error ? error.message : "Upload failed",
			});
	});
};

router.post(
	"/application",
	authenticateToken,
	handleUpload,
	applicationController.createApplication.bind(applicationController),
);

export default router;

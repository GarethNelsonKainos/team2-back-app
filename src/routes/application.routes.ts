import { Router } from "express";
import type { ApplicationController } from "../controllers/application.controller.js";
import { handleUpload } from "../middleware/file-upload.middleware.js";
import { authenticateToken } from "../middleware/auth.middleware.js";

export default function applicationRouter(
	applicationController: ApplicationController,
) {
	const router = Router();

	router.post(
		"/application",
		authenticateToken,
		handleUpload,
		applicationController.createApplication.bind(applicationController),
	);

	router.get(
		"/myApplications", 
		applicationController.getApplicationsForUser.bind(applicationController));

	return router;
}

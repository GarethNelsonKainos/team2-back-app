import { Router } from "express";
import type { ApplicationController } from "../controllers/application.controller.js";
import { handleUpload } from "../middleware/file-upload.middleware.js";
import authorisedRoles, { authenticateToken } from "../middleware/auth.middleware.js";
import UserRole from "../types/UserRole.js";

export default function applicationRouter(
	applicationController: ApplicationController,
) {
	const router = Router();

	router.post(
		"/application",
		authorisedRoles([UserRole.USER, UserRole.ADMIN]),
		handleUpload,
		applicationController.createApplication.bind(applicationController),
	);

	router.get(
		"/myApplications",
		authorisedRoles([UserRole.USER, UserRole.ADMIN]),
		applicationController.getApplicationsForUser.bind(applicationController),
	);

	router.get(
		"/admin/job-roles/:jobRoleId",
		authorisedRoles([UserRole.ADMIN]),
		applicationController.getApplicationByJobRoleId.bind(applicationController),
	);

	return router;
}

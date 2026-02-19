import express, { type Router } from "express";
import { JobRoleController } from "../controllers/job-role.controller.js";
import { AuthController } from "../controllers/auth.controller.js";

const router: Router = express.Router();
const jobRoleController = new JobRoleController();
const _authController = new AuthController();

router.get("/job-roles", jobRoleController.getJobRoles.bind(jobRoleController));

router.get(
	"/job-roles/:id",
	jobRoleController.getJobRoleById.bind(jobRoleController),
);

router.get(
	"/capabilities",
	jobRoleController.getCapabilities.bind(jobRoleController),
);

router.get("/bands", jobRoleController.getBands.bind(jobRoleController));

router.get("/statuses", jobRoleController.getStatuses.bind(jobRoleController));

router.put(
	"/job-roles/:id",
	jobRoleController.updateJobRole.bind(jobRoleController),
);

router.delete(
	"/job-roles/:id",
	jobRoleController.deleteJobRole.bind(jobRoleController),
);

router.post(
	"/job-roles",
	jobRoleController.createJobRole.bind(jobRoleController),
);

export default router;

import express, { type Router } from "express";
import { JobRoleController } from "../controllers/job-role.controller.js";

const router: Router = express.Router();
const jobRoleController = new JobRoleController();

router.get("/job-roles", jobRoleController.getJobRoles.bind(jobRoleController));

router.get(
	"/job-roles/:id",
	jobRoleController.getJobRoleById.bind(jobRoleController),
);
export default router;

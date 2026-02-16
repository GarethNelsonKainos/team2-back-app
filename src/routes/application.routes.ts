import express, { type Router } from "express";
import { ApplicationController } from "../controllers/application.controller.js";

const router: Router = express.Router();
const applicationController = new ApplicationController();

router.get(
	"/adminApplications",
	applicationController.getApplications.bind(applicationController),
);
router.get(
	"/adminApplications/:id",
	applicationController.getApplicationById.bind(applicationController),
);
router.put(
	"/adminApplications/:id",
	applicationController.updateApplication.bind(applicationController),
);
router.delete(
	"/adminApplications/:id",
	applicationController.deleteApplication.bind(applicationController),
);

router.post(
	"/createApplication",
	applicationController.createApplication.bind(applicationController),
);

router.get(
	"/myApplications/:userId",
	applicationController.getApplicationsForUser.bind(applicationController),
);
router.get(
	"/myApplications/application/:id",
	applicationController.getApplicationById.bind(applicationController),
);
router.delete(
	"/myApplications/application/:id",
	applicationController.deleteApplication.bind(applicationController),
);
export default router;

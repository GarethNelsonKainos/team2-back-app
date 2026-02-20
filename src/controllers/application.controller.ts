import type { Request, Response } from "express";
import type { ApplicationService } from "../services/application.service";
import {
	ApplicationStatus,
	type CreateApplicationRequest,
} from "../types/CreateApplication";

export class ApplicationController {
	private applicationService: ApplicationService;

	constructor(applicationService: ApplicationService) {
		this.applicationService = applicationService;
	}

	async createApplication(req: Request, res: Response): Promise<void> {
		const applicationData = req.body as CreateApplicationRequest;
		const file = req.file;

		if (!file) {
			res.status(400).json({ error: "CV file is required" });
			return;
		}

		if (
			applicationData.jobRoleId === undefined ||
			applicationData.jobRoleId === null
		) {
			res.status(400).json({ error: "jobRoleId is required" });
			return;
		}
		applicationData.userId = res.locals.user.userId;

		try {
			await this.applicationService.createApplication(applicationData, file);
			res.status(201).send();
		} catch (error) {
			console.error("Error creating application:", error);
			res.status(500).send();
		}
	}

	async getApplicationsForUser(_req: Request, res: Response): Promise<void> {
		const userId = res.locals.user.userId;

		try {
			const applications =
				await this.applicationService.getApplicationsForUser(userId);
			res.json(applications);
		} catch (error) {
			console.error("Error fetching applications for user:", error);
			res.status(500).send();
		}
	}

	async getApplicationByJobRoleId(req: Request, res: Response): Promise<void> {
		const jobRoleId = req.params.jobRoleId;

		if (typeof jobRoleId !== "string" || jobRoleId.trim() === "") {
			res.status(400).json({ error: "Invalid jobRoleId" });
			return;
		}

		try {
			const applications =
				await this.applicationService.getApplicationByJobRoleId(jobRoleId);
			res.json(applications);
		} catch (error) {
			console.error("Error fetching applications for job role:", error);
			res.status(500).send();
		}
	}

	async updateApplicationStatus(req: Request, res: Response): Promise<void> {
		console.log("Received request to update application status:");
		const applicationId = req.params.applicationId;
		const newStatus = req.params.status as ApplicationStatus;

		if (typeof applicationId !== "string" || applicationId.trim() === "") {
			res.status(400).json({ error: "Invalid applicationId" });
			return;
		}

		if (!newStatus || !Object.values(ApplicationStatus).includes(newStatus)) {
			res.status(400).json({ error: "Invalid Status" });
			return;
		}

		try {
			await this.applicationService.updateApplicationStatus(
				applicationId,
				newStatus,
			);
			res.sendStatus(200);
		} catch (error) {
			console.error("Error updating application status:", error);
			res.status(500).send();
		}
	}
}

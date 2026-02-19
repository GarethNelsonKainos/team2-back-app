import type { Request, Response } from "express";
import type { ApplicationService } from "../services/application.service";
import type { CreateApplicationRequest } from "../types/CreateApplication";

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
}

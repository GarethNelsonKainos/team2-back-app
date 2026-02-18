import type { Request, Response } from "express";
import { ApplicationService } from "../services/application.service.js";

export interface CreateApplicationInput {
	userId: string;
	jobRoleId: string;
	status?: "IN_PROGRESS" | "REJECTED" | "ACCEPTED";
	cvUrl?: string;
}

export class ApplicationController {
	constructor(private applicationService: ApplicationService) {}

	async createApplication(req: Request, res: Response): Promise<void> {
		const applicationData = req.body as CreateApplicationInput;
		applicationData.status = "IN_PROGRESS"; // Explicitly set status
		const file = req.file;

		// Validate that file exists
		if (!file) {
			res.status(400).json({ error: "CV file is required" });
			return;
		}

		try {
			await this.applicationService.createApplication(applicationData, file);
			res.status(201).send();
		} catch (error) {
			console.error("Error creating application:", error);
			res.status(500).send();
		}
	}
}

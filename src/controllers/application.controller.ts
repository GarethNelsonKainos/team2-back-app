import type { Request, Response } from "express";
import type { Prisma } from "../generated/prisma/client.js";
import { ApplicationService } from "../services/application.service.js";

export class ApplicationController {
	private applicationService = new ApplicationService();

	async createApplication(req: Request, res: Response): Promise<void> {
		const applicationData = req.body as Prisma.ApplicationsUncheckedCreateInput;
		const file = req.file;

		// Validate that file exists
		if (!file) {
			res.status(400).json({ error: "CV file is required" });
			return;
		}

		try {
			const application = await this.applicationService.createApplication(
				applicationData,
				file,
			);
			res.status(201).json(application);
		} catch (error) {
			console.error("Error creating application:", error);
			res.status(500).send();
		}
	}
}

import type { Request, Response } from "express";
import { ApplicationService } from "../services/application.service.js";

export class ApplicationController {
	private applicationService = new ApplicationService();

	async getApplications(_req: Request, res: Response): Promise<void> {
		try {
			const applications = await this.applicationService.getApplications();
			res.status(200).json(applications);
		} catch (error) {
			console.error("Error fetching applications:", error);
			res.status(500).send();
		}
	}

	async getApplicationById(req: Request, res: Response): Promise<void> {
		const { id } = req.params;
		if (typeof id !== "string" || !id.trim()) {
			res
				.status(400)
				.json({ error: "Application ID format incorrect. Need String." });
			return;
		}
		try {
			const application = await this.applicationService.getApplicationById(id);
			if (application) {
				res.status(200).json(application);
			} else {
				res.status(404).send();
			}
		} catch (error) {
			console.error(`Error fetching application with id ${id}:`, error);
			res.status(500).send();
		}
	}

	async createApplication(req: Request, res: Response): Promise<void> {
		const applicationData = req.body;
		const file = req.file;

		// Validate that file exists
		if (!file) {
			res.status(400).json({ error: "CV file is required" });
			return;
		}

		try {
			const application =
				await this.applicationService.createApplication(applicationData, file);
			res.status(201).json(application);
		} catch (error) {
			console.error("Error creating application:", error);
			res.status(500).json({
				error:
					error instanceof Error
						? error.message
						: "Internal server error",
			});
		}
	}

	async updateApplication(req: Request, res: Response): Promise<void> {
		const { id } = req.params;
		const applicationData = req.body;
		if (typeof id !== "string" || !id.trim()) {
			res
				.status(400)
				.json({ error: "Application ID format incorrect. Need String." });
			return;
		}
		try {
			const updatedApplication =
				await this.applicationService.updateApplication(id, applicationData);
			res.status(200).json(updatedApplication);
		} catch (error) {
			console.error(`Error updating application with id ${id}:`, error);
			res.status(500).send();
		}
	}

	async deleteApplication(req: Request, res: Response): Promise<void> {
		const { id } = req.params;
		if (typeof id !== "string" || !id.trim()) {
			res
				.status(400)
				.json({ error: "Application ID format incorrect. Need String." });
			return;
		}
		try {
			await this.applicationService.deleteApplication(id);
			res.status(204).send();
		} catch (error) {
			console.error(`Error deleting application with id ${id}:`, error);
			res.status(500).send();
		}
	}

	async getApplicationsForUser(req: Request, res: Response): Promise<void> {
		const { userId } = req.params;
		if (typeof userId !== "string" || !userId.trim()) {
			res.status(400).json({ error: "User ID format incorrect. Need String." });
			return;
		}
		try {
			const applications =
				await this.applicationService.getApplicationsForUser(userId);
			res.status(200).json(applications);
		} catch (error) {
			console.error(
				`Error fetching applications for user with id ${userId}:`,
				error,
			);
			res.status(500).send();
		}
	}
}

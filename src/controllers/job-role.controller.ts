import type { Request, Response } from "express";
import { JobRoleService } from "../services/job-role.service.js";
import { validateAndBuildCreateJobRoleInput } from "./validators/job-role-create.validator.js";

type JobRoleParams = { id: string };

export class JobRoleController {
	private jobRoleService = new JobRoleService();

	async getJobRoles(_req: Request, res: Response): Promise<void> {
		try {
			const jobRoles = await this.jobRoleService.getOpenJobRoles();
			res.status(200).json(jobRoles);
		} catch (error) {
			console.error("Error fetching job roles:", error);
			res.status(500).send();
		}
	}

	async getJobRoleById(
		req: Request<JobRoleParams>,
		res: Response,
	): Promise<void> {
		const { id } = req.params;
		try {
			const jobRole = await this.jobRoleService.getJobRoleById(id);
			if (jobRole) {
				res.status(200).json(jobRole);
			} else {
				res.status(404).send();
			}
		} catch (error) {
			console.error(`Error fetching job role with id ${id}:`, error);
			res.status(500).send();
		}
	}

	async getCapabilities(_req: Request, res: Response): Promise<void> {
		try {
			const capabilities = await this.jobRoleService.getAllCapabilities();
			res.status(200).json(capabilities);
		} catch (error) {
			console.error("Error fetching capabilities:", error);
			res.status(500).send();
		}
	}

	async getBands(_req: Request, res: Response): Promise<void> {
		try {
			const bands = await this.jobRoleService.getAllBands();
			res.status(200).json(bands);
		} catch (error) {
			console.error("Error fetching bands:", error);
			res.status(500).send();
		}
	}

	async createJobRole(req: Request, res: Response): Promise<void> {
		try {
			const validationResult = validateAndBuildCreateJobRoleInput(req.body);

			if (validationResult.errors.length > 0) {
				res.status(400).json({ errors: validationResult.errors });
				return;
			}

			if (!validationResult.input) {
				res.status(400).json({ errors: ["Invalid request body"] });
				return;
			}

			const jobRole = await this.jobRoleService.createJobRole(validationResult.input);

			res.status(201).json(jobRole);
		} catch (error) {
			console.error("Error creating job role:", error);

			// Check for foreign key constraint errors
			if ((error as Error).message?.includes("Foreign key constraint")) {
				res
					.status(400)
					.json({ errors: ["Invalid capability or band selected"] });
				return;
			}

			res.status(500).json({ errors: ["Internal server error"] });
		}
	}
}

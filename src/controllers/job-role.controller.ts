import type { Request, Response } from "express";
import { JobRoleService } from "../services/job-role.service.js";

type JobRoleParams = { id: string };

interface CreateJobRoleBody {
	roleName: string;
	description: string;
	sharepointUrl: string;
	responsibilities: string;
	numberOfOpenPositions: number;
	location: string;
	closingDate: string;
	capabilityId: string;
	bandId: string;
}

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
			const body = req.body as CreateJobRoleBody;

			// Validate required fields
			if (!body.roleName || !body.roleName.trim()) {
				res.status(400).json({ error: "Role name is required" });
				return;
			}

			if (!body.description || !body.description.trim()) {
				res.status(400).json({ error: "Job spec summary is required" });
				return;
			}

			if (!body.sharepointUrl || !body.sharepointUrl.trim()) {
				res.status(400).json({ error: "SharePoint link is required" });
				return;
			}

			// Validate SharePoint URL format
			const urlRegex = /^https?:\/\/.+/;
			if (!urlRegex.test(body.sharepointUrl)) {
				res.status(400).json({ error: "Invalid SharePoint URL format" });
				return;
			}

			if (!body.responsibilities || !body.responsibilities.trim()) {
				res.status(400).json({ error: "Responsibilities are required" });
				return;
			}

			if (!body.numberOfOpenPositions || body.numberOfOpenPositions < 1) {
				res
					.status(400)
					.json({ error: "Number of open positions must be at least 1" });
				return;
			}

			if (!body.location || !body.location.trim()) {
				res.status(400).json({ error: "Location is required" });
				return;
			}

			if (!body.closingDate) {
				res.status(400).json({ error: "Closing date is required" });
				return;
			}

			// Validate closing date
			const closingDate = new Date(body.closingDate);
			if (Number.isNaN(closingDate.getTime())) {
				res.status(400).json({ error: "Invalid closing date format" });
				return;
			}

			// Validate closing date is in the future
			const today = new Date();
			today.setHours(0, 0, 0, 0);
			if (closingDate < today) {
				res.status(400).json({ error: "Closing date must be in the future" });
				return;
			}

			if (!body.capabilityId || !body.capabilityId.trim()) {
				res.status(400).json({ error: "Capability is required" });
				return;
			}

			if (!body.bandId || !body.bandId.trim()) {
				res.status(400).json({ error: "Band is required" });
				return;
			}

			// Create the job role
			const jobRole = await this.jobRoleService.createJobRole({
				roleName: body.roleName.trim(),
				description: body.description.trim(),
				sharepointUrl: body.sharepointUrl.trim(),
				responsibilities: body.responsibilities.trim(),
				numberOfOpenPositions: body.numberOfOpenPositions,
				location: body.location.trim(),
				closingDate: closingDate,
				capabilityId: body.capabilityId.trim(),
				bandId: body.bandId.trim(),
			});

			res.status(201).json(jobRole);
		} catch (error) {
			console.error("Error creating job role:", error);

			// Check for foreign key constraint errors
			if (
				error instanceof Error &&
				error.message.includes("Foreign key constraint")
			) {
				res.status(400).json({ error: "Invalid capability or band selected" });
				return;
			}

			res.status(500).json({ error: "Internal server error" });
		}
	}
}

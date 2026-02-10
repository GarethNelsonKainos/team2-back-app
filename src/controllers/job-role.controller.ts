import type { Request, Response } from "express";
import { JobRoleService } from "../services/job-role.service.js";

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
}

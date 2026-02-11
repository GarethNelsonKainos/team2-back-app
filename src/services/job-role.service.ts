import { JobRoleDao } from "../daos/job-role.dao.js";
import type { JobRole } from "../generated/prisma/client.js";

export class JobRoleService {
	private jobRoleDao = new JobRoleDao();

	async getOpenJobRoles(): Promise<JobRole[]> {
		const jobRoles = await this.jobRoleDao.getOpenJobRoles();

		return jobRoles;
	}

	async getJobRoleById(id: string): Promise<JobRole | null> {
		const jobRole = await this.jobRoleDao.getJobRoleById(id);

		return jobRole;
	}
}

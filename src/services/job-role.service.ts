import { JobRoleDao, type CreateJobRoleInput } from "../daos/job-role.dao.js";
import type { JobRole, Capability, Band } from "../generated/prisma/client.js";

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

	async getAllCapabilities(): Promise<Capability[]> {
		return this.jobRoleDao.getAllCapabilities();
	}

	async getAllBands(): Promise<Band[]> {
		return this.jobRoleDao.getAllBands();
	}

	async createJobRole(input: CreateJobRoleInput): Promise<JobRole> {
		return this.jobRoleDao.createJobRole(input);
	}
}

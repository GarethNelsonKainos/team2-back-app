import type { JobRole } from "../generated/prisma/client.js";
import { prisma } from "./prisma.js";

export class JobRoleDao {
	async getOpenJobRoles(): Promise<JobRole[]> {
		return prisma.jobRole.findMany({
			include: {
				capability: true,
				band: true,
				status: true,
			},
		});
	}

	async getJobRoleById(id: string): Promise<JobRole | null> {
		return prisma.jobRole.findUnique({
			where: { jobRoleId: id },
			include: {
				capability: true,
				band: true,
				status: true,
			},
		});
	}
}

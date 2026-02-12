import type { JobRole } from "../generated/prisma/client";
import { prisma } from "./prisma";

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

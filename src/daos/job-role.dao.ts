import type { JobRole } from "../generated/prisma/client";
import { prisma } from "./prisma";

export interface Capability {
	capabilityId: number;
	capabilityName: string;
}

export interface Band {
	nameId: number;
	bandName: string;
}

export class JobRoleDao {
	async getOpenJobRoles(): Promise<JobRole[]> {
		return await prisma.jobRole.findMany({
			include: {
				capability: true,
				band: true,
				status: true,
			},
		});
	}

	async getJobRoleById(id: string): Promise<JobRole | null> {
		return await prisma.jobRole.findUnique({
			where: { jobRoleId: id },
			include: {
				capability: true,
				band: true,
				status: true,
			},
		});
	}
}

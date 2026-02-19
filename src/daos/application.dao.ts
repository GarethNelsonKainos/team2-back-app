import type { JobApplication } from "../types/CreateApplication";
import { prisma } from "./prisma";

export class ApplicationDao {
	async createApplication(applicationData: JobApplication) {
		return prisma.applications.create({
			data: {
				...applicationData,
			},
		});
	}

	async getApplicationsForUser(userId: string) {
		return prisma.applications.findMany({
			where: {
				userId: userId,
			},
			include: {
				jobRole: true,
			},
		});
	}

	async getApplicationsByJobRoleId(jobRoleId: string) {
		return prisma.applications.findMany({
			where: {
				jobRoleId: jobRoleId,
			},
		});
	}
}

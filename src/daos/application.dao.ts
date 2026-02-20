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
			include: {
				user: {
					select: {
						firstName: true,
						secondName: true,
					},
				},
				jobRole: {
					select: {
						roleName: true,
						location: true,
					},
				},
			},
		});
	}

	async updateApplicationStatus(applicationId: string, newStatus: string) {
		await prisma.applications.update({
			where: {
				applicationId: applicationId,
			},
			data: {
				status: newStatus,
			},
		});
	}
}

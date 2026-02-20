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

	async updateApplicationStatus(applicationId: string, newStatus: string) {
		try {
			await prisma.applications.update({
				where: {
					applicationId: applicationId,
				},
				data: {
					status: newStatus,
				},
			});
		} catch (error) {
			console.error("Error updating application status in DAO:", error);
			throw error;
		}
	}
}

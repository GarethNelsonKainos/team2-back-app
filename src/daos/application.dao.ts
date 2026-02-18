import { JobApplication } from "../types/CreateApplication";
import { prisma } from "./prisma";

export class ApplicationDao {
	async createApplication(applicationData: JobApplication) {
		return prisma.applications.create({
			data: {
				...applicationData,
				userId: 'e8df82cb-c865-4515-b31f-738b686d65e4'
			},
		});
	}
}
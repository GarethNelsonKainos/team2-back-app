import { JobApplication } from "../types/CreateApplication";
import { prisma } from "./prisma";

export class ApplicationDao {
	async createApplication(applicationData: JobApplication) {
		return prisma.applications.create({
			data: {
				...applicationData,
			},
		});
	}
}
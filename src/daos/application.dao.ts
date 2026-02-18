import { prisma } from "./prisma.js";
import type { CreateApplicationInput } from "../controllers/application.controller.js";

export class ApplicationDao {
	async createApplication(applicationData: CreateApplicationInput) {
		return prisma.applications.create({
			data: applicationData,
		});
	}
}

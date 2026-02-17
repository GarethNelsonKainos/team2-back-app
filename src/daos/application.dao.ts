import type { Prisma } from "../generated/prisma/client.js";
import { prisma } from "./prisma.js";

export class ApplicationDao {
	async createApplication(
		applicationData: Prisma.ApplicationsUncheckedCreateInput,
	) {
		return prisma.applications.create({
			data: applicationData,
		});
	}
}

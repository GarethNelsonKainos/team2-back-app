import type { JobRole, Capability, Band } from "../generated/prisma/client.js";
import { prisma } from "./prisma.js";

export interface CreateJobRoleInput {
	roleName: string;
	description: string;
	sharepointUrl: string;
	responsibilities: string;
	numberOfOpenPositions: number;
	location: string;
	closingDate: Date;
	capabilityId: string;
	bandId: string;
}

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

	async getAllCapabilities(): Promise<Capability[]> {
		return prisma.capability.findMany({
			orderBy: {
				capabilityName: "asc",
			},
		});
	}

	async getAllBands(): Promise<Band[]> {
		return prisma.band.findMany({
			orderBy: {
				bandName: "asc",
			},
		});
	}

	async createJobRole(input: CreateJobRoleInput): Promise<JobRole> {
		// Get the "Open" status
		const openStatus = await prisma.status.findFirst({
			where: { statusName: "Open" },
		});

		if (!openStatus) {
			throw new Error("Open status not found in database");
		}

		return prisma.jobRole.create({
			data: {
				roleName: input.roleName,
				description: input.description,
				sharepointUrl: input.sharepointUrl,
				responsibilities: input.responsibilities,
				numberOfOpenPositions: input.numberOfOpenPositions,
				location: input.location,
				closingDate: input.closingDate,
				capabilityId: input.capabilityId,
				bandId: input.bandId,
				statusId: openStatus.statusId,
			},
			include: {
				capability: true,
				band: true,
				status: true,
			},
		});
	}
}

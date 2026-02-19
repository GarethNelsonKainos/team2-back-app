import type {
	JobRole,
	Capability,
	Band,
	Status,
} from "../generated/prisma/client.js";
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

export interface UpdateJobRoleInput {
	roleName?: string;
	description?: string;
	sharepointUrl?: string;
	responsibilities?: string;
	numberOfOpenPositions?: number;
	location?: string;
	closingDate?: Date;
	capabilityId?: string;
	bandId?: string;
	statusId?: string;
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

	async getAllStatuses(): Promise<Status[]> {
		return prisma.status.findMany({
			orderBy: {
				statusName: "asc",
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

	async updateJobRole(
		id: string,
		input: UpdateJobRoleInput,
	): Promise<JobRole | null> {
		const existingJobRole = await prisma.jobRole.findUnique({
			where: { jobRoleId: id },
		});

		if (!existingJobRole) {
			return null;
		}

		return prisma.jobRole.update({
			where: { jobRoleId: id },
			data: input,
			include: {
				capability: true,
				band: true,
				status: true,
			},
		});
	}

	async deleteJobRole(id: string): Promise<JobRole | null> {
		try {
			const deletedJobRole = await prisma.jobRole.delete({
				where: { jobRoleId: id },
			});
			return deletedJobRole;
		} catch (error) {
			// Prisma throws P2025 when record doesn't exist
			if ((error as any).code === "P2025") {
				return null;
			}
			throw error;
		}
	}
}

import type { Request, Response } from "express";
import { JobRoleService } from "../services/job-role.service.js";
import {
	validateStringField,
	validateSharePointUrl,
	validateClosingDate,
	validateNumberOfOpenPositions,
} from "../validators/job-role.validators.js";

type JobRoleParams = { id: string };

interface JobRoleBase {
	roleName: string;
	description: string;
	sharepointUrl: string;
	responsibilities: string;
	numberOfOpenPositions: number;
	location: string;
	closingDate: string;
	capabilityId: string;
	bandId: string;
}

type CreateJobRoleBody = JobRoleBase;

interface UpdateJobRoleBody extends Partial<JobRoleBase> {
	statusId?: string;
}

export class JobRoleController {
	private jobRoleService = new JobRoleService();

	private validateCreateFields(body: CreateJobRoleBody): {
		error?: string;
		data?: {
			roleName: string;
			description: string;
			sharepointUrl: string;
			responsibilities: string;
			numberOfOpenPositions: number;
			location: string;
			closingDate: Date;
			capabilityId: string;
			bandId: string;
		};
	} {
		// Validate roleName
		const roleNameError = validateStringField(body.roleName, "Role name", true);
		if (roleNameError) return { error: roleNameError };
		const roleNameTrimmed = body.roleName.trim();

		// Validate description
		const descriptionError = validateStringField(
			body.description,
			"Job spec summary",
			true,
		);
		if (descriptionError) return { error: descriptionError };
		const descriptionTrimmed = body.description.trim();

		// Validate sharepointUrl
		const sharepointUrlError = validateSharePointUrl(body.sharepointUrl, true);
		if (sharepointUrlError) return { error: sharepointUrlError };
		const sharepointUrlTrimmed = body.sharepointUrl.trim();

		// Validate responsibilities
		const responsibilitiesError = validateStringField(
			body.responsibilities,
			"Responsibilities",
			true,
		);
		if (responsibilitiesError) return { error: responsibilitiesError };
		const responsibilitiesTrimmed = body.responsibilities.trim();

		// Validate numberOfOpenPositions
		const numberOfOpenPositionsError = validateNumberOfOpenPositions(
			body.numberOfOpenPositions,
			true,
		);
		if (numberOfOpenPositionsError)
			return { error: numberOfOpenPositionsError };

		// Validate location
		const locationError = validateStringField(body.location, "Location", true);
		if (locationError) return { error: locationError };
		const locationTrimmed = body.location.trim();

		// Validate closingDate
		const closingDateValidation = validateClosingDate(body.closingDate, true);
		if (closingDateValidation.error)
			return { error: closingDateValidation.error };
		const closingDate = closingDateValidation.parsedDate!;

		// Validate capabilityId
		const capabilityIdError = validateStringField(
			body.capabilityId,
			"Capability",
			true,
		);
		if (capabilityIdError) return { error: capabilityIdError };
		const capabilityIdTrimmed = body.capabilityId.trim();

		// Validate bandId
		const bandIdError = validateStringField(body.bandId, "Band", true);
		if (bandIdError) return { error: bandIdError };
		const bandIdTrimmed = body.bandId.trim();

		return {
			data: {
				roleName: roleNameTrimmed,
				description: descriptionTrimmed,
				sharepointUrl: sharepointUrlTrimmed,
				responsibilities: responsibilitiesTrimmed,
				numberOfOpenPositions: body.numberOfOpenPositions,
				location: locationTrimmed,
				closingDate,
				capabilityId: capabilityIdTrimmed,
				bandId: bandIdTrimmed,
			},
		};
	}

	private validateUpdateFields(body: UpdateJobRoleBody): {
		error?: string;
		data?: {
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
		};
	} {
		// Validate at least one field is being updated
		if (Object.keys(body).length === 0) {
			return { error: "No fields to update" };
		}

		// Validate roleName if provided
		const roleNameError = validateStringField(
			body.roleName,
			"Role name",
			false,
		);
		if (roleNameError) return { error: roleNameError };

		// Validate description if provided
		const descriptionError = validateStringField(
			body.description,
			"Job spec summary",
			false,
		);
		if (descriptionError) return { error: descriptionError };

		// Validate sharepointUrl if provided
		const sharepointUrlError = validateSharePointUrl(body.sharepointUrl, false);
		if (sharepointUrlError) return { error: sharepointUrlError };

		// Validate responsibilities if provided
		const responsibilitiesError = validateStringField(
			body.responsibilities,
			"Responsibilities",
			false,
		);
		if (responsibilitiesError) return { error: responsibilitiesError };

		// Validate numberOfOpenPositions if provided
		const numberOfOpenPositionsError = validateNumberOfOpenPositions(
			body.numberOfOpenPositions,
			false,
		);
		if (numberOfOpenPositionsError)
			return { error: numberOfOpenPositionsError };

		// Validate location if provided
		const locationError = validateStringField(body.location, "Location", false);
		if (locationError) return { error: locationError };

		// Validate closingDate if provided
		const closingDateValidation = validateClosingDate(body.closingDate, false);
		if (closingDateValidation.error)
			return { error: closingDateValidation.error };

		// Validate capabilityId if provided
		const capabilityIdError = validateStringField(
			body.capabilityId,
			"Capability",
			false,
		);
		if (capabilityIdError) return { error: capabilityIdError };

		// Validate bandId if provided
		const bandIdError = validateStringField(body.bandId, "Band", false);
		if (bandIdError) return { error: bandIdError };

		// Validate statusId if provided
		const statusIdError = validateStringField(body.statusId, "Status", false);
		if (statusIdError) return { error: statusIdError };

		// Build update object with trimmed values
		const updateData: {
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
		} = {};

		if (body.roleName !== undefined) updateData.roleName = body.roleName.trim();
		if (body.description !== undefined)
			updateData.description = body.description.trim();
		if (body.sharepointUrl !== undefined)
			updateData.sharepointUrl = body.sharepointUrl.trim();
		if (body.responsibilities !== undefined)
			updateData.responsibilities = body.responsibilities.trim();
		if (body.numberOfOpenPositions !== undefined)
			updateData.numberOfOpenPositions = body.numberOfOpenPositions;
		if (body.location !== undefined) updateData.location = body.location.trim();
		if (closingDateValidation.parsedDate !== undefined)
			updateData.closingDate = closingDateValidation.parsedDate;
		if (body.capabilityId !== undefined)
			updateData.capabilityId = body.capabilityId.trim();
		if (body.bandId !== undefined) updateData.bandId = body.bandId.trim();
		if (body.statusId !== undefined) updateData.statusId = body.statusId.trim();

		return { data: updateData };
	}

	async getJobRoles(_req: Request, res: Response): Promise<void> {
		try {
			const jobRoles = await this.jobRoleService.getOpenJobRoles();
			res.status(200).json(jobRoles);
		} catch (error) {
			console.error("Error fetching job roles:", error);
			res.status(500).send();
		}
	}

	async getJobRoleById(
		req: Request<JobRoleParams>,
		res: Response,
	): Promise<void> {
		const { id } = req.params;
		try {
			const jobRole = await this.jobRoleService.getJobRoleById(id);
			if (jobRole) {
				res.status(200).json(jobRole);
			} else {
				res.status(404).send();
			}
		} catch (error) {
			console.error(`Error fetching job role with id ${id}:`, error);
			res.status(500).send();
		}
	}

	async getCapabilities(_req: Request, res: Response): Promise<void> {
		try {
			const capabilities = await this.jobRoleService.getAllCapabilities();
			res.status(200).json(capabilities);
		} catch (error) {
			console.error("Error fetching capabilities:", error);
			res.status(500).send();
		}
	}

	async getBands(_req: Request, res: Response): Promise<void> {
		try {
			const bands = await this.jobRoleService.getAllBands();
			res.status(200).json(bands);
		} catch (error) {
			console.error("Error fetching bands:", error);
			res.status(500).send();
		}
	}

	async getStatuses(_req: Request, res: Response): Promise<void> {
		try {
			const statuses = await this.jobRoleService.getAllStatuses();
			res.status(200).json(statuses);
		} catch (error) {
			console.error("Error fetching statuses:", error);
			res.status(500).send();
		}
	}

	async createJobRole(req: Request, res: Response): Promise<void> {
		try {
			const body = req.body as CreateJobRoleBody;

			const validation = this.validateCreateFields(body);
			if (validation.error) {
				res.status(400).json({ error: validation.error });
				return;
			}

			const jobRole = await this.jobRoleService.createJobRole(validation.data!);
			res.status(201).json(jobRole);
		} catch (error) {
			console.error("Error creating job role:", error);

			// Check for foreign key constraint errors
			if ((error as Error).message?.includes("Foreign key constraint")) {
				res.status(400).json({ error: "Invalid capability or band selected" });
				return;
			}

			res.status(500).json({ error: "Internal server error" });
		}
	}

	async updateJobRole(
		req: Request<JobRoleParams>,
		res: Response,
	): Promise<void> {
		const { id } = req.params;

		try {
			const body = req.body as UpdateJobRoleBody;

			const validation = this.validateUpdateFields(body);
			if (validation.error) {
				res.status(400).json({ error: validation.error });
				return;
			}

			const updatedJobRole = await this.jobRoleService.updateJobRole(
				id,
				validation.data!,
			);

			if (!updatedJobRole) {
				res.status(404).json({ error: "Job role not found" });
				return;
			}

			res.status(200).json(updatedJobRole);
		} catch (error) {
			console.error(`Error updating job role with id ${id}:`, error);

			// Check for foreign key constraint errors
			if ((error as Error).message?.includes("Foreign key constraint")) {
				res
					.status(400)
					.json({ error: "Invalid capability, band, or status selected" });
				return;
			}

			res.status(500).json({ error: "Internal server error" });
		}
	}

	async deleteJobRole(
		req: Request<JobRoleParams>,
		res: Response,
	): Promise<void> {
		try {
			const { id } = req.params;
			const deletedJobRole = await this.jobRoleService.deleteJobRole(id);

			if (!deletedJobRole) {
				res.status(404).json({ error: "Job role not found" });
				return;
			}

			res.status(204).send();
		} catch (error) {
			console.error("Error deleting job role:", error);
			res.status(500).json({ error: "Internal server error" });
		}
	}
}

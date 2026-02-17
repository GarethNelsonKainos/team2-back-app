import type { Request, Response } from "express";
import { JobRoleService } from "../services/job-role.service.js";

type JobRoleParams = { id: string };

interface CreateJobRoleBody {
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

export class JobRoleController {
	private jobRoleService = new JobRoleService();

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

	async createJobRole(req: Request, res: Response): Promise<void> {
		try {
			const body = req.body as Partial<CreateJobRoleBody>;
			const errors: string[] = [];

			// Validate required fields
			if (
				!body.roleName ||
				typeof body.roleName !== "string" ||
				!body.roleName.trim()
			) {
				errors.push("Role name is required");
			}

			if (
				!body.description ||
				typeof body.description !== "string" ||
				!body.description.trim()
			) {
				errors.push("Job spec summary is required");
			}

			if (
				!body.sharepointUrl ||
				typeof body.sharepointUrl !== "string" ||
				!body.sharepointUrl.trim()
			) {
				errors.push("SharePoint link is required");
			} else {
				// Validate SharePoint URL format
				try {
					const parsedUrl = new URL(body.sharepointUrl);
					if (
						parsedUrl.protocol !== "http:" &&
						parsedUrl.protocol !== "https:"
					) {
						errors.push("Invalid SharePoint URL format");
					}
				} catch {
					errors.push("Invalid SharePoint URL format");
				}
			}

			if (
				!body.responsibilities ||
				typeof body.responsibilities !== "string" ||
				!body.responsibilities.trim()
			) {
				errors.push("Responsibilities are required");
			}

			// Parse and validate numberOfOpenPositions
			let numberOfOpenPositions: number | undefined;
			if (
				body.numberOfOpenPositions === undefined ||
				body.numberOfOpenPositions === null ||
				(typeof body.numberOfOpenPositions === "string" &&
					(body.numberOfOpenPositions as string).trim() === "")
			) {
				errors.push("Number of open positions must be at least 1");
			} else {
				numberOfOpenPositions = Number(body.numberOfOpenPositions);
				if (
					Number.isNaN(numberOfOpenPositions) ||
					!Number.isFinite(numberOfOpenPositions) ||
					numberOfOpenPositions < 1 ||
					!Number.isInteger(numberOfOpenPositions)
				) {
					errors.push("Number of open positions must be at least 1");
				}
			}

			if (
				!body.location ||
				typeof body.location !== "string" ||
				!body.location.trim()
			) {
				errors.push("Location is required");
			}

			let closingDate: Date | undefined;
			if (!body.closingDate || typeof body.closingDate !== "string") {
				errors.push("Closing date is required");
			} else {
				closingDate = new Date(body.closingDate);
				if (Number.isNaN(closingDate.getTime())) {
					errors.push("Invalid closing date format");
				} else {
					// Validate closing date is in the future
					const today = new Date();
					today.setHours(0, 0, 0, 0);
					closingDate.setHours(0, 0, 0, 0);
					if (closingDate <= today) {
						errors.push("Closing date must be in the future");
					}
				}
			}

			if (
				!body.capabilityId ||
				typeof body.capabilityId !== "string" ||
				!body.capabilityId.trim()
			) {
				errors.push("Capability is required");
			}

			if (
				!body.bandId ||
				typeof body.bandId !== "string" ||
				!body.bandId.trim()
			) {
				errors.push("Band is required");
			}

			if (errors.length > 0) {
				res.status(400).json({ errors });
				return;
			}

			// All validations passed, create the job role
			// At this point, all required fields are present and valid
			const jobRole = await this.jobRoleService.createJobRole({
				roleName: (body.roleName as string).trim(),
				description: (body.description as string).trim(),
				sharepointUrl: (body.sharepointUrl as string).trim(),
				responsibilities: (body.responsibilities as string).trim(),
				numberOfOpenPositions: numberOfOpenPositions as number,
				location: (body.location as string).trim(),
				closingDate: closingDate as Date,
				capabilityId: (body.capabilityId as string).trim(),
				bandId: (body.bandId as string).trim(),
			});

			res.status(201).json(jobRole);
		} catch (error) {
			console.error("Error creating job role:", error);

			// Check for foreign key constraint errors
			if ((error as Error).message?.includes("Foreign key constraint")) {
				res
					.status(400)
					.json({ errors: ["Invalid capability or band selected"] });
				return;
			}

			res.status(500).json({ errors: ["Internal server error"] });
		}
	}
}

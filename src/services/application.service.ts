import type { ApplicationDao } from "../daos/application.dao.js";
import type { S3Service } from "./s3.service.js";
import type { Applications } from "../generated/prisma/client.js";
import {
	ApplicationStatus,
	type CreateApplicationRequest,
	type JobApplication,
} from "../types/CreateApplication.js";

export class ApplicationService {
	constructor(
		private applicationDao: ApplicationDao,
		private s3Service: S3Service,
	) {}

	async createApplication(
		applicationData: CreateApplicationRequest,
		file: Express.Multer.File,
	): Promise<void> {
		const fileKey = this.s3Service.generateFileKey(
			file.originalname,
			applicationData.userId,
		);
		const cvUrl = await this.s3Service.uploadFile(file, fileKey);

		const application: JobApplication = {
			...applicationData,
			cvUrl: cvUrl,
			status: ApplicationStatus.IN_PROGRESS,
		};

		await this.applicationDao.createApplication(application);
	}

	async getApplicationsForUser(userId: string): Promise<Applications[]> {
		return this.applicationDao.getApplicationsForUser(userId);
	}

	async getApplicationByJobRoleId(jobRoleId: string): Promise<Applications[]> {
		return this.applicationDao.getApplicationsByJobRoleId(jobRoleId);
	}

	async updateApplicationStatus(
		applicationId: string,
		newStatus: ApplicationStatus,
	): Promise<void> {
		await this.applicationDao.updateApplicationStatus(applicationId, newStatus);
	}
}

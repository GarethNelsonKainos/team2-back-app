import type { ApplicationDao } from "../daos/application.dao.js";
import type { S3Service } from "./s3.service.js";
import { ApplicationStatus, CreateApplicationRequest, JobApplication } from "../types/CreateApplication.js";

export class ApplicationService {
	constructor(
		private applicationDao: ApplicationDao,
		private s3Service: S3Service,
	) {}

	async createApplication(
		applicationData: CreateApplicationRequest,
		file: Express.Multer.File,
	): Promise<void> {
		const fileKey = this.s3Service.generateFileKey(file.originalname);
		const cvUrl = await this.s3Service.uploadFile(file, fileKey);

		const application: JobApplication = {
			...applicationData,
			cvUrl: cvUrl,
			status: ApplicationStatus.IN_PROGRESS
		}

		await this.applicationDao.createApplication(application);
	}
}
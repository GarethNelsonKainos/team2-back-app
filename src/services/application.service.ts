import type { Applications } from "../generated/prisma/client.js";
import type { ApplicationDao } from "../daos/application.dao.js";
import type { S3Service } from "./s3.service.js";
import type { CreateApplicationInput } from "../controllers/application.controller.js";

export class ApplicationService {
	constructor(
		private applicationDao: ApplicationDao,
		private s3Service: S3Service,
	) {}

	async createApplication(
		applicationData: CreateApplicationInput,
		file: Express.Multer.File,
	): Promise<Applications> {
		// Upload file to S3 first
		const fileKey = this.s3Service.generateFileKey(file.originalname);
		const cvUrl = await this.s3Service.uploadFile(file, fileKey);

		// Create the application with the file URL already set
		applicationData.cvUrl = cvUrl;
		const application =
			await this.applicationDao.createApplication(applicationData);

		return application;
	}
}

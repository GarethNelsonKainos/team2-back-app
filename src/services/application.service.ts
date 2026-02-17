import type { Applications, Prisma } from "../generated/prisma/client.js";
import { ApplicationDao } from "../daos/application.dao.js";
import { S3Service } from "./s3.service.js";

export class ApplicationService {
	private applicationDao = new ApplicationDao();
	private s3Service = new S3Service();

	async createApplication(
		applicationData: Prisma.ApplicationsUncheckedCreateInput,
		file: Express.Multer.File,
	): Promise<Applications> {
		// Upload file to S3 first
		const fileKey = this.s3Service.generateFileKey(file.originalname);
		const cvUrl = await this.s3Service.uploadFile(file, fileKey);

		// Create the application with the file URL already set
		const applicationDataWithUrl = {
			...applicationData,
			cvUrl,
		};
		const application = await this.applicationDao.createApplication(
			applicationDataWithUrl,
		);

		return application;
	}
}

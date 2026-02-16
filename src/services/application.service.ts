import type { Applications } from "../generated/prisma/client.js";
import { ApplicationDao } from "../daos/application.dao.js";
import { S3Service } from "./s3.service.js";

export class ApplicationService {
	private applicationDao = new ApplicationDao();
	private s3Service = new S3Service();

	async getApplications(): Promise<Applications[]> {
		const applications = await this.applicationDao.getAllApplications();
		return applications;
	}

	async getApplicationById(id: string): Promise<Applications | null> {
		const application = await this.applicationDao.getApplicationById(id);
		return application;
	}

	async getApplicationsForUser(userId: string): Promise<Applications[]> {
		const applications =
			await this.applicationDao.getAllApplicationsForUser(userId);
		return applications;
	}

	async createApplication(
		applicationData: any,
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
		const application =
			await this.applicationDao.createApplication(applicationDataWithUrl);

		return application;
	}

	async updateApplication(
		id: string,
		applicationData: any,
	): Promise<Applications> {
		const result = await this.applicationDao.updateApplication(
			id,
			applicationData,
		);
		return result;
	}

	async deleteApplication(id: string): Promise<Applications> {
		const result = await this.applicationDao.deleteApplication(id);
		return result;
	}
}

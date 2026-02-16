import type { Applications } from "../generated/prisma/client.js";
import { ApplicationDao } from "../daos/application.dao.js";

export class ApplicationService {
    private applicationDao = new ApplicationDao();

    async getApplications(): Promise<Applications[]> {
        const applications = await this.applicationDao.getAllApplications();
		return applications;
    }

    async getApplicationById(id: string): Promise<Applications | null> {
        const application = await this.applicationDao.getApplicationById(id);
        return application;
    }   

    async getApplicationsForUser(userId: string): Promise<Applications[]> {
        const applications = await this.applicationDao.getAllApplicationsForUser(userId);
        return applications;
    }

    async createApplication(applicationData: any): Promise<Applications> {
        const result = await this.applicationDao.createApplication(applicationData);
        return result;
    }

    async updateApplication(id: string, applicationData: any): Promise<Applications> {
        const result = await this.applicationDao.updateApplication(id, applicationData);
        return result;
    }

    async deleteApplication(id: string): Promise<Applications> {
        const result = await this.applicationDao.deleteApplication(id);
        return result;
    }

}
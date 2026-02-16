import type { Applications } from "../generated/prisma/client.js";
import { prisma } from "./prisma.js";

export class ApplicationDao{
    async getAllApplications(): Promise<Applications[]> {
         return prisma.applications.findMany({});
    }

    async getApplicationById(id: string): Promise<Applications | null> {
        return prisma.applications.findUnique({
            where: { applicationId: id }
        });
    }

    async createApplication(applicationData: any) {
        return prisma.applications.create({
            data: applicationData
        });
    }

    async updateApplication(id: string, applicationData: any) {
        return prisma.applications.update({
            where: { applicationId: id },
            data: applicationData
        });
    }

    async deleteApplication(id: string) {
        return prisma.applications.delete({
            where: { applicationId: id }
        });
    }

    async getAllApplicationsForUser(userId: string): Promise<Applications[]>  {
        return prisma.applications.findMany({
            where: { userId: userId }
        });
    }
}
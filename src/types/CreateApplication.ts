export enum ApplicationStatus {
	IN_PROGRESS = "IN_PROGRESS",
}

export interface CreateApplicationRequest {
	userId: string;
	jobRoleId: string;
}

export interface JobApplication {
	userId: string;
	jobRoleId: string;
	status: ApplicationStatus;
	cvUrl: string;
}

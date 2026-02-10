import type { JobRole } from "../models/job-role.model.js";
import type { JobRoleResponse } from "../models/job-role.response.model.js";

export class JobRoleMapper {
	static toResponse(
		jobRole: JobRole,
		capabilityName: string,
		bandName: string,
	): JobRoleResponse {
		return {
			jobRoleId: jobRole.jobRoleId,
			roleName: jobRole.roleName,
			location: jobRole.location,
			capability: capabilityName,
			band: bandName,
			closingDate: jobRole.closingDate.toISOString().slice(0, 10),
		};
	}

	static toResponseList(
		jobRoles: JobRole[],
		capabilities: Map<number, string>,
		bands: Map<number, string>,
	): JobRoleResponse[] {
		return jobRoles.map((jobRole) =>
			JobRoleMapper.toResponse(
				jobRole,
				capabilities.get(jobRole.capabilityId) || "Unknown",
				bands.get(jobRole.bandId) || "Unknown",
			),
		);
	}
}

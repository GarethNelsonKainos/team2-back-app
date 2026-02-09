import { JobRole } from '../models/job-role.model';
import { JobRoleResponse } from '../models/job-role.response.model';

export class JobRoleMapper {
  static toResponse(jobRole: JobRole, capabilityName: string, bandName: string): JobRoleResponse {
    return {
      jobRoleId: jobRole.jobRoleId,
      roleName: jobRole.roleName,
      location: jobRole.location,
      capability: capabilityName,
      band: bandName,
      closingDate: jobRole.closingDate.toISOString().split('T')[0],
    };
  }

  static toResponseList(jobRoles: JobRole[], capabilities: Map<number, string>, bands: Map<number, string>): JobRoleResponse[] {
    return jobRoles.map((jobRole) =>
      this.toResponse(
        jobRole,
        capabilities.get(jobRole.capabilityId) || 'Unknown',
        bands.get(jobRole.bandId) || 'Unknown'
      )
    );
  }
}
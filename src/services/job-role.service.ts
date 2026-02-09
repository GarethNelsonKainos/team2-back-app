import { JobRoleDao } from '../daos/job-role.dao';
import { JobRoleResponse } from '../models/job-role.response.model';
import { JobRoleMapper } from '../mappers/job-role.mapper';

export class JobRoleService {
  private jobRoleDao = new JobRoleDao();

  async getOpenJobRoles(): Promise<JobRoleResponse[]> {
    const { jobRoles, capabilities, bands } = await this.jobRoleDao.getOpenJobRoles();

    const capabilityMap = new Map(
      capabilities.map((capability) => [capability.capabilityId, capability.capabilityName])
    );
    const bandMap = new Map(bands.map((band) => [band.bandId, band.bandName]));

    return JobRoleMapper.toResponseList(jobRoles, capabilityMap, bandMap);
  }
}

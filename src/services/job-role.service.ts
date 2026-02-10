import { JobRoleDao } from '../daos/job-role.dao.js';
import { JobRole } from '../generated/prisma/client.js';

export class JobRoleService {
  private jobRoleDao = new JobRoleDao();

  async getOpenJobRoles(): Promise<JobRole[]> {
    const jobRoles = await this.jobRoleDao.getOpenJobRoles();

    return jobRoles;
  }
}

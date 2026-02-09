import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import { JobRoleDao } from '../../src/daos/job-role.dao.js';
import jobRoleRouter from '../../src/routes/job-role.routes.js';

describe('JobRole Routes - Integration Tests', () => {
  let getOpenJobRolesSpy: ReturnType<typeof vi.spyOn>;

  // Mock data at the DAO level (database boundary)
  const mockDaoResponse = {
    jobRoles: [
      {
        jobRoleId: 1,
        roleName: 'Software Engineer',
        location: 'Belfast',
        capabilityId: 1,
        bandId: 2,
        closingDate: new Date('2026-03-15'),
        status: 'open',
      },
      {
        jobRoleId: 2,
        roleName: 'Data Analyst',
        location: 'London',
        capabilityId: 3,
        bandId: 2,
        closingDate: new Date('2026-04-01'),
        status: 'open',
      },
    ],
    capabilities: [
      { capabilityId: 1, capabilityName: 'Engineering' },
      { capabilityId: 3, capabilityName: 'Data' },
    ],
    bands: [{ bandId: 2, bandName: 'Consultant' }],
  };

  // Expected response after full stack processing (mapper transforms DAO → Response)
  const expectedResponse = [
    {
      jobRoleId: 1,
      roleName: 'Software Engineer',
      location: 'Belfast',
      capability: 'Engineering',
      band: 'Consultant',
      closingDate: '2026-03-15',
    },
    {
      jobRoleId: 2,
      roleName: 'Data Analyst',
      location: 'London',
      capability: 'Data',
      band: 'Consultant',
      closingDate: '2026-04-01',
    },
  ];

  beforeEach(() => {
    // Mock at the DAO level - let service and mapper run with real code
    getOpenJobRolesSpy = vi
      .spyOn(JobRoleDao.prototype, 'getOpenJobRoles')
      .mockResolvedValue(mockDaoResponse);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const buildApp = () => {
    const app = express();
    app.use(jobRoleRouter);
    return app;
  };

  describe('GET /job-roles', () => {
    it('should return 200 with job role data after full stack processing', async () => {
      const app = buildApp();

      const response = await request(app).get('/job-roles');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(expectedResponse);
      expect(getOpenJobRolesSpy).toHaveBeenCalledTimes(1);
    });

    it('should return 200 with an empty array when no roles exist', async () => {
      getOpenJobRolesSpy.mockResolvedValueOnce({
        jobRoles: [],
        capabilities: [],
        bands: [],
      });
      const app = buildApp();

      const response = await request(app).get('/job-roles');

      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
      expect(getOpenJobRolesSpy).toHaveBeenCalledTimes(1);
    });

    it('should return 500 when the DAO throws', async () => {
      getOpenJobRolesSpy.mockRejectedValueOnce(new Error('Database error'));
      const app = buildApp();

      const response = await request(app).get('/job-roles');

      expect(response.status).toBe(500);
    });

    it('should handle missing capability/band mappings', async () => {
      getOpenJobRolesSpy.mockResolvedValueOnce({
        jobRoles: [
          {
            jobRoleId: 1,
            roleName: 'Test Role',
            location: 'Test Location',
            capabilityId: 999, // Non-existent capability
            bandId: 888, // Non-existent band
            closingDate: new Date('2026-03-15'),
            status: 'open',
          },
        ],
        capabilities: [],
        bands: [],
      });
      const app = buildApp();

      const response = await request(app).get('/job-roles');

      expect(response.status).toBe(200);
      expect(response.body).toEqual([
        {
          jobRoleId: 1,
          roleName: 'Test Role',
          location: 'Test Location',
          capability: 'Unknown',
          band: 'Unknown',
          closingDate: '2026-03-15',
        },
      ]);
    });
  });
});

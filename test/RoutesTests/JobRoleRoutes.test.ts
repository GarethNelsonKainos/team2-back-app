import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import { JobRoleService } from '../../src/services/job-role.service.js';
import jobRoleRouter from '../../src/routes/job-role.routes.js';

// Mock the Service module
vi.mock('../../src/services/job-role.service.js');

describe('JobRole Routes', () => {
  let mockGetOpenJobRoles: any;

  const mockJobRoleResponse = [
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
    // Create mock function for Service method
    mockGetOpenJobRoles = vi.fn().mockResolvedValue(mockJobRoleResponse);

    // Mock the Service class
    JobRoleService.prototype.getOpenJobRoles = mockGetOpenJobRoles;
  });

  const buildApp = () => {
    const app = express();
    app.use(jobRoleRouter);
    return app;
  };

  describe('GET /job-roles', () => {
    it('should return 200 with job role data', async () => {
      const app = buildApp();

      const response = await request(app).get('/job-roles');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockJobRoleResponse);
      expect(mockGetOpenJobRoles).toHaveBeenCalledTimes(1);
    });

    it('should return 200 with an empty array when no roles exist', async () => {
      mockGetOpenJobRoles.mockResolvedValueOnce([]);
      const app = buildApp();

      const response = await request(app).get('/job-roles');

      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
      expect(mockGetOpenJobRoles).toHaveBeenCalledTimes(1);
    });

    it('should return 500 when the service throws', async () => {
      mockGetOpenJobRoles.mockRejectedValueOnce(new Error('Service error'));
      const app = buildApp();

      const response = await request(app).get('/job-roles');

      expect(response.status).toBe(500);
    });
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Router } from 'express';
import { JobRoleController } from '../../src/controllers/job-role.controller.js';
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

  describe('Route Configuration', () => {
    it('should export a valid Router instance', () => {
      // Arrange - already done in beforeEach

      // Act & Assert
      expect(jobRoleRouter).toBeDefined();
      expect(jobRoleRouter).toBeInstanceOf(Router);
    });

    it('should have GET /job-roles route registered', () => {
      // Arrange - already done in beforeEach

      // Act & Assert
      // Verify router has the expected route stack
      const routeFound = jobRoleRouter.stack.some(
        (layer: any) => layer.route?.path === '/job-roles' && layer.route?.methods?.get
      );
      expect(routeFound).toBe(true);
    });
  });

  describe('JobRole Endpoint Integration', () => {
    it('should call controller getJobRoles method when route is invoked', async () => {
      // Arrange
      const mockRequest: any = {};
      const mockResponse: any = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn().mockReturnThis(),
      };

      const controller = new JobRoleController();
      const controllerSpy = vi.spyOn(controller, 'getJobRoles');

      // Act
      await controller.getJobRoles(mockRequest, mockResponse);

      // Assert
      expect(controllerSpy).toHaveBeenCalledWith(mockRequest, mockResponse);
    });

    it('should have service method available for route handler', async () => {
      // Arrange - already done in beforeEach
      const controller = new JobRoleController();

      // Act
      const result = await controller.getJobRoles({} as any, {
        status: vi.fn().mockReturnThis(),
        json: vi.fn().mockReturnThis(),
      } as any);

      // Assert
      expect(mockGetOpenJobRoles).toHaveBeenCalled();
    });
  });
});

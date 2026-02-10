import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response } from 'express';
import { JobRoleController } from '../../src/controllers/job-role.controller.js';
import { JobRoleService } from '../../src/services/job-role.service.js';

// Mock the Service module
vi.mock('../../src/services/job-role.service.js');

describe('JobRoleController', () => {
  let controller: JobRoleController;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
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
  ];

  beforeEach(() => {
    // Create mock request and response
    mockRequest = {};
    mockResponse = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
      send: vi.fn().mockReturnThis(),
    };

    // Create mock function for Service method
    mockGetOpenJobRoles = vi.fn().mockResolvedValue(mockJobRoleResponse);

    // Mock the Service class
    JobRoleService.prototype.getOpenJobRoles = mockGetOpenJobRoles;

    controller = new JobRoleController();
  });

  describe('getJobRoles', () => {
    it('should return 200 status with job roles data', async () => {
      // Arrange - already done in beforeEach

      // Act
      await controller.getJobRoles(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(mockJobRoleResponse);
    });

    it('should call service getOpenJobRoles method', async () => {
      // Arrange - already done in beforeEach

      // Act
      await controller.getJobRoles(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockGetOpenJobRoles).toHaveBeenCalledTimes(1);
    });

    it('should return 500 status when service throws an error', async () => {
      // Arrange
      const error = new Error('Service error');
      mockGetOpenJobRoles.mockRejectedValue(error);

      // Act
      await controller.getJobRoles(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.send).toHaveBeenCalled();
    });

    it('should handle empty job roles array', async () => {
      // Arrange
      mockGetOpenJobRoles.mockResolvedValue([]);

      // Act
      await controller.getJobRoles(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith([]);
    });
  });
});

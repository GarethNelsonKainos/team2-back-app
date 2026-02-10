import { describe, it, expect } from "vitest";
import { JobRoleMapper } from "../../src/mappers/job-role.mapper.ts";
import { JobRole } from "../../src/models/job-role.model.ts";

const mockJobRole: JobRole = {
  jobRoleId: 1,
  roleName: "Software Engineer",
  location: "Belfast",
  capabilityId: 3,
  bandId: 2,
  closingDate: new Date("2026-03-15"),
  status: "open",
};

describe("JobRoleMapper", () => {
  describe("toResponse", () => {
    it("should convert JobRole to JobRoleResponse correctly", () => {
      // Arrange
      const capabilityName = "Engineering";
      const bandName = "Consultant";

      // Act
      const result = JobRoleMapper.toResponse(
        mockJobRole,
        capabilityName,
        bandName,
      );

      // Assert
      expect(result).toEqual({
        jobRoleId: 1,
        roleName: "Software Engineer",
        location: "Belfast",
        capability: "Engineering",
        band: "Consultant",
        closingDate: "2026-03-15",
      });
    });

    it("should convert multiple JobRoles to JobRoleResponses", () => {
      // Arrange
      const jobRoles: JobRole[] = [
        {
          jobRoleId: 1,
          roleName: "Software Engineer",
          location: "Belfast",
          capabilityId: 1,
          bandId: 2,
          closingDate: new Date("2026-03-15"),
          status: "open",
        },
        {
          jobRoleId: 2,
          roleName: "Data Analyst",
          location: "London",
          capabilityId: 2,
          bandId: 3,
          closingDate: new Date("2026-04-01"),
          status: "open",
        },
      ];

      const capabilities = new Map([
        [1, "Engineering"],
        [2, "Data"],
      ]);
      const bands = new Map([
        [2, "Consultant"],
        [3, "Senior Consultant"],
      ]);

      // Act
      const result = JobRoleMapper.toResponseList(
        jobRoles,
        capabilities,
        bands,
      );

      // Assert
      expect(result).toHaveLength(2);
      expect(result[0].capability).toBe("Engineering");
      expect(result[1].band).toBe("Senior Consultant");
    });

    it('should return "Unknown" for missing capability or band', () => {
      // Arrange
      const jobRoles: JobRole[] = [
        {
          jobRoleId: 1,
          roleName: "Software Engineer",
          location: "Belfast",
          capabilityId: 999,
          bandId: 888,
          closingDate: new Date("2026-03-15"),
          status: "open",
        },
      ];

      const capabilities = new Map([[1, "Engineering"]]);
      const bands = new Map([[2, "Consultant"]]);

      // Act
      const result = JobRoleMapper.toResponseList(
        jobRoles,
        capabilities,
        bands,
      );

      // Assert
      expect(result[0].capability).toBe("Unknown");
      expect(result[0].band).toBe("Unknown");
    });

    it("should return empty array when given empty array", () => {
      const result = JobRoleMapper.toResponseList([], new Map(), new Map());
      expect(result).toEqual([]);
    });
  });
});

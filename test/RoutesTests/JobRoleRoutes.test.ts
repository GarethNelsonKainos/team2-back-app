import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import express from "express";
import request from "supertest";
import { JobRoleDao } from "../../src/daos/job-role.dao.js";
import jobRoleRouter from "../../src/routes/job-role.routes.js";

describe("JobRole Routes - Integration Tests", () => {
	let getOpenJobRolesSpy: ReturnType<typeof vi.spyOn>;

	// Mock data at the DAO level (database boundary)
	// Mock data matching Prisma's return structure
	const mockDaoResponse = [
		{
			jobRoleId: "550e8400-e29b-41d4-a716-446655440000",
			roleName: "Software Engineer",
			location: "Belfast",
			capabilityId: "660e8400-e29b-41d4-a716-446655440001",
			bandId: "770e8400-e29b-41d4-a716-446655440002",
			closingDate: new Date("2026-03-15"),
			capability: {
				capabilityId: "660e8400-e29b-41d4-a716-446655440001",
				capabilityName: "Engineering",
				jobRoles: [],
			},
			band: {
				nameId: "770e8400-e29b-41d4-a716-446655440002",
				bandName: "Consultant",
				jobRoles: [],
			},
		},
		{
			jobRoleId: "550e8400-e29b-41d4-a716-446655440003",
			roleName: "Data Analyst",
			location: "London",
			capabilityId: "660e8400-e29b-41d4-a716-446655440004",
			bandId: "770e8400-e29b-41d4-a716-446655440002",
			closingDate: new Date("2026-04-01"),
			capability: {
				capabilityId: "660e8400-e29b-41d4-a716-446655440004",
				capabilityName: "Data",
				jobRoles: [],
			},
			band: {
				nameId: "770e8400-e29b-41d4-a716-446655440002",
				bandName: "Consultant",
				jobRoles: [],
			},
		},
	];

	// Expected response (same as what DAO returns - no transformation)
	const expectedResponse = [
		{
			jobRoleId: "550e8400-e29b-41d4-a716-446655440000",
			roleName: "Software Engineer",
			location: "Belfast",
			capabilityId: "660e8400-e29b-41d4-a716-446655440001",
			bandId: "770e8400-e29b-41d4-a716-446655440002",
			closingDate: "2026-03-15T00:00:00.000Z", // ISO string format
			capability: {
				capabilityId: "660e8400-e29b-41d4-a716-446655440001",
				capabilityName: "Engineering",
				jobRoles: [],
			},
			band: {
				nameId: "770e8400-e29b-41d4-a716-446655440002",
				bandName: "Consultant",
				jobRoles: [],
			},
		},
		{
			jobRoleId: "550e8400-e29b-41d4-a716-446655440003",
			roleName: "Data Analyst",
			location: "London",
			capabilityId: "660e8400-e29b-41d4-a716-446655440004",
			bandId: "770e8400-e29b-41d4-a716-446655440002",
			closingDate: "2026-04-01T00:00:00.000Z",
			capability: {
				capabilityId: "660e8400-e29b-41d4-a716-446655440004",
				capabilityName: "Data",
				jobRoles: [],
			},
			band: {
				nameId: "770e8400-e29b-41d4-a716-446655440002",
				bandName: "Consultant",
				jobRoles: [],
			},
		},
	];

	beforeEach(() => {
		// Mock at the DAO level - let service and mapper run with real code
		getOpenJobRolesSpy = vi
			.spyOn(JobRoleDao.prototype, "getOpenJobRoles")
			.mockResolvedValue(mockDaoResponse as any);
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	const buildApp = () => {
		const app = express();
		app.use(jobRoleRouter);
		return app;
	};

	describe("GET /job-roles", () => {
		it("should return 200 with job role data after full stack processing", async () => {
			const app = buildApp();

			const response = await request(app).get("/job-roles");

			expect(response.status).toBe(200);
			expect(response.body).toEqual(expectedResponse);
			expect(getOpenJobRolesSpy).toHaveBeenCalledTimes(1);
		});

		it("should return 200 with an empty array when no roles exist", async () => {
			getOpenJobRolesSpy.mockResolvedValueOnce([]);
			const app = buildApp();

			const response = await request(app).get("/job-roles");

			expect(response.status).toBe(200);
			expect(response.body).toEqual([]);
			expect(getOpenJobRolesSpy).toHaveBeenCalledTimes(1);
		});

		it("should return 500 when the DAO throws", async () => {
			getOpenJobRolesSpy.mockRejectedValueOnce(new Error("Database error"));
			const app = buildApp();

			const response = await request(app).get("/job-roles");

			expect(response.status).toBe(500);
		});
	});
});

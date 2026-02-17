import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import express from "express";
import request from "supertest";
import { JobRoleDao } from "../../src/daos/job-role.dao.js";
import jobRoleRouter from "../../src/routes/job-role.routes.js";

describe("JobRole Routes - Integration Tests", () => {
	let getOpenJobRolesSpy: ReturnType<typeof vi.spyOn>;
	let getJobRoleByIdSpy: ReturnType<typeof vi.spyOn>;
	let getAllCapabilitiesSpy: ReturnType<typeof vi.spyOn>;
	let getAllBandsSpy: ReturnType<typeof vi.spyOn>;
	let createJobRoleSpy: ReturnType<typeof vi.spyOn>;

	// Mock data at the DAO level (database boundary)
	// Mock data matching Prisma's return structure
	const mockDaoResponse = [
		{
			jobRoleId: "550e8400-e29b-41d4-a716-446655440000",
			roleName: "Software Engineer",
			location: "Belfast",
			closingDate: new Date("2026-03-15"),
			description: null,
			responsibilities: null,
			sharepointUrl: null,
			numberOfOpenPositions: null,
			capabilityId: "660e8400-e29b-41d4-a716-446655440001",
			bandId: "770e8400-e29b-41d4-a716-446655440002",
			statusId: "880e8400-e29b-41d4-a716-446655440003",
			capability: {
				capabilityId: "660e8400-e29b-41d4-a716-446655440001",
				capabilityName: "Engineering",
				jobRoles: [],
			},
			band: {
				bandId: "770e8400-e29b-41d4-a716-446655440002",
				bandName: "Consultant",
				jobRoles: [],
			},
			status: {
				statusId: "880e8400-e29b-41d4-a716-446655440003",
				statusName: "Open",
				jobRoles: [],
			},
		},
		{
			jobRoleId: "550e8400-e29b-41d4-a716-446655440003",
			roleName: "Data Analyst",
			location: "London",
			closingDate: new Date("2026-04-01"),
			description: null,
			responsibilities: null,
			sharepointUrl: null,
			numberOfOpenPositions: null,
			capabilityId: "660e8400-e29b-41d4-a716-446655440004",
			bandId: "770e8400-e29b-41d4-a716-446655440002",
			statusId: "880e8400-e29b-41d4-a716-446655440003",
			capability: {
				capabilityId: "660e8400-e29b-41d4-a716-446655440004",
				capabilityName: "Data",
				jobRoles: [],
			},
			band: {
				bandId: "770e8400-e29b-41d4-a716-446655440002",
				bandName: "Consultant",
				jobRoles: [],
			},
			status: {
				statusId: "880e8400-e29b-41d4-a716-446655440003",
				statusName: "Open",
				jobRoles: [],
			},
		},
	];

	const expectedResponse = [
		{
			jobRoleId: "550e8400-e29b-41d4-a716-446655440000",
			roleName: "Software Engineer",
			location: "Belfast",
			closingDate: "2026-03-15T00:00:00.000Z",
			description: null,
			responsibilities: null,
			sharepointUrl: null,
			numberOfOpenPositions: null,
			capabilityId: "660e8400-e29b-41d4-a716-446655440001",
			bandId: "770e8400-e29b-41d4-a716-446655440002",
			statusId: "880e8400-e29b-41d4-a716-446655440003",
			capability: {
				capabilityId: "660e8400-e29b-41d4-a716-446655440001",
				capabilityName: "Engineering",
				jobRoles: [],
			},
			band: {
				bandId: "770e8400-e29b-41d4-a716-446655440002",
				bandName: "Consultant",
				jobRoles: [],
			},
			status: {
				statusId: "880e8400-e29b-41d4-a716-446655440003",
				statusName: "Open",
				jobRoles: [],
			},
		},
		{
			jobRoleId: "550e8400-e29b-41d4-a716-446655440003",
			roleName: "Data Analyst",
			location: "London",
			closingDate: "2026-04-01T00:00:00.000Z",
			description: null,
			responsibilities: null,
			sharepointUrl: null,
			numberOfOpenPositions: null,
			capabilityId: "660e8400-e29b-41d4-a716-446655440004",
			bandId: "770e8400-e29b-41d4-a716-446655440002",
			statusId: "880e8400-e29b-41d4-a716-446655440003",
			capability: {
				capabilityId: "660e8400-e29b-41d4-a716-446655440004",
				capabilityName: "Data",
				jobRoles: [],
			},
			band: {
				bandId: "770e8400-e29b-41d4-a716-446655440002",
				bandName: "Consultant",
				jobRoles: [],
			},
			status: {
				statusId: "880e8400-e29b-41d4-a716-446655440003",
				statusName: "Open",
				jobRoles: [],
			},
		},
	];

	const mockCapabilitiesResponse = [
		{
			capabilityId: "660e8400-e29b-41d4-a716-446655440001",
			capabilityName: "Engineering",
		},
		{
			capabilityId: "660e8400-e29b-41d4-a716-446655440004",
			capabilityName: "Data",
		},
	];

	const mockBandsResponse = [
		{
			bandId: "770e8400-e29b-41d4-a716-446655440002",
			bandName: "Consultant",
		},
		{
			bandId: "770e8400-e29b-41d4-a716-446655440005",
			bandName: "Senior Consultant",
		},
	];

	beforeEach(() => {
		// Mock at the DAO level - let service and mapper run with real code
		getOpenJobRolesSpy = vi
			.spyOn(JobRoleDao.prototype, "getOpenJobRoles")
			.mockResolvedValue(mockDaoResponse);
		getJobRoleByIdSpy = vi
			.spyOn(JobRoleDao.prototype, "getJobRoleById")
			.mockResolvedValue(mockDaoResponse[0]);
		getAllCapabilitiesSpy = vi
			.spyOn(JobRoleDao.prototype, "getAllCapabilities")
			.mockResolvedValue(mockCapabilitiesResponse);
		getAllBandsSpy = vi
			.spyOn(JobRoleDao.prototype, "getAllBands")
			.mockResolvedValue(mockBandsResponse);
		createJobRoleSpy = vi
			.spyOn(JobRoleDao.prototype, "createJobRole")
			.mockResolvedValue(mockDaoResponse[0]);
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

	describe("GET /job-roles/:id", () => {
		it("should return 200 with job role data when role exists", async () => {
			const app = buildApp();

			const response = await request(app).get(
				"/job-roles/550e8400-e29b-41d4-a716-446655440000",
			);

			expect(response.status).toBe(200);
			expect(response.body).toEqual(expectedResponse[0]);
		});

		it("should return 404 when the job role does not exist", async () => {
			getJobRoleByIdSpy.mockResolvedValueOnce(null);
			const app = buildApp();

			const response = await request(app).get("/job-roles/non-existent-id");

			expect(response.status).toBe(404);
		});

		it("should return 500 when the DAO throws", async () => {
			getJobRoleByIdSpy.mockRejectedValueOnce(new Error("Database error"));
			const app = buildApp();

			const response = await request(app).get(
				"/job-roles/550e8400-e29b-41d4-a716-446655440000",
			);

			expect(response.status).toBe(500);
		});
	});

	describe("GET /capabilities", () => {
		it("should return 200 with capabilities data", async () => {
			const app = buildApp();

			const response = await request(app).get("/capabilities");

			expect(response.status).toBe(200);
			expect(response.body).toEqual(mockCapabilitiesResponse);
			expect(getAllCapabilitiesSpy).toHaveBeenCalledTimes(1);
		});

		it("should return 200 with empty array when no capabilities exist", async () => {
			getAllCapabilitiesSpy.mockResolvedValueOnce([]);
			const app = buildApp();

			const response = await request(app).get("/capabilities");

			expect(response.status).toBe(200);
			expect(response.body).toEqual([]);
		});

		it("should return 500 when the DAO throws", async () => {
			getAllCapabilitiesSpy.mockRejectedValueOnce(new Error("Database error"));
			const app = buildApp();

			const response = await request(app).get("/capabilities");

			expect(response.status).toBe(500);
		});
	});

	describe("GET /bands", () => {
		it("should return 200 with bands data", async () => {
			const app = buildApp();

			const response = await request(app).get("/bands");

			expect(response.status).toBe(200);
			expect(response.body).toEqual(mockBandsResponse);
			expect(getAllBandsSpy).toHaveBeenCalledTimes(1);
		});

		it("should return 200 with empty array when no bands exist", async () => {
			getAllBandsSpy.mockResolvedValueOnce([]);
			const app = buildApp();

			const response = await request(app).get("/bands");

			expect(response.status).toBe(200);
			expect(response.body).toEqual([]);
		});

		it("should return 500 when the DAO throws", async () => {
			getAllBandsSpy.mockRejectedValueOnce(new Error("Database error"));
			const app = buildApp();

			const response = await request(app).get("/bands");

			expect(response.status).toBe(500);
		});
	});

	describe("POST /job-roles", () => {
		it("should return 201 with created job role", async () => {
			// Mock the response for this specific test
			const mockCreatedJobRole = {
				jobRoleId: "new-job-role-id",
				roleName: "Test Role",
				description: "Test description",
				sharepointUrl: "https://sharepoint.test",
				responsibilities: "Test responsibilities",
				numberOfOpenPositions: 5,
				location: "Belfast",
				closingDate: new Date("2026-12-31"),
				capabilityId: "660e8400-e29b-41d4-a716-446655440001",
				bandId: "770e8400-e29b-41d4-a716-446655440002",
				statusId: "880e8400-e29b-41d4-a716-446655440003",
				capability: mockCapabilitiesResponse[0],
				band: mockBandsResponse[0],
				status: {
					statusId: "880e8400-e29b-41d4-a716-446655440003",
					statusName: "Open",
					jobRoles: [],
				},
			};

			createJobRoleSpy.mockResolvedValueOnce(mockCreatedJobRole);

			// Need to add express.json() middleware for POST requests
			const app = express();
			app.use(express.json());
			app.use(jobRoleRouter);

			const newJobRole = {
				roleName: "Test Role",
				description: "Test description",
				sharepointUrl: "https://sharepoint.test",
				responsibilities: "Test responsibilities",
				numberOfOpenPositions: 5,
				location: "Belfast",
				closingDate: "2026-12-31",
				capabilityId: "660e8400-e29b-41d4-a716-446655440001",
				bandId: "770e8400-e29b-41d4-a716-446655440002",
			};

			const response = await request(app).post("/job-roles").send(newJobRole);

			expect(response.status).toBe(201);
			expect(response.body.roleName).toBe("Test Role");
			expect(createJobRoleSpy).toHaveBeenCalledTimes(1);
		});

		it("should return 400 when role name is missing", async () => {
			const app = express();
			app.use(express.json());
			app.use(jobRoleRouter);

			const response = await request(app).post("/job-roles").send({});

			       expect(response.status).toBe(400);
			       expect(response.body.errors).toEqual([
				       "Role name is required",
				       "Job spec summary is required",
				       "SharePoint link is required",
				       "Responsibilities are required",
				       "Number of open positions must be at least 1",
				       "Location is required",
				       "Closing date is required",
				       "Capability is required",
				       "Band is required",
			       ]);
		});

		it("should return 400 when SharePoint URL is invalid", async () => {
			const app = express();
			app.use(express.json());
			app.use(jobRoleRouter);

			const invalidJobRole = {
				roleName: "Test Role",
				description: "Test description",
				sharepointUrl: "invalid-url",
				responsibilities: "Test responsibilities",
				numberOfOpenPositions: 5,
				location: "Belfast",
				closingDate: "2026-12-31",
				capabilityId: "cap-1",
				bandId: "band-1",
			};

			const response = await request(app)
				.post("/job-roles")
				.send(invalidJobRole);

			   expect(response.status).toBe(400);
			   expect(response.body.errors).toEqual(["Invalid SharePoint URL format"]);
		});

		it("should return 400 when closing date is in the past", async () => {
			const app = express();
			app.use(express.json());
			app.use(jobRoleRouter);

			const invalidJobRole = {
				roleName: "Test Role",
				description: "Test description",
				sharepointUrl: "https://sharepoint.test",
				responsibilities: "Test responsibilities",
				numberOfOpenPositions: 5,
				location: "Belfast",
				closingDate: "2020-01-01",
				capabilityId: "cap-1",
				bandId: "band-1",
			};

			const response = await request(app)
				.post("/job-roles")
				.send(invalidJobRole);

			   expect(response.status).toBe(400);
			   expect(response.body.errors).toEqual(["Closing date must be in the future"]);
		});

		it("should return 500 when the DAO throws", async () => {
			createJobRoleSpy.mockRejectedValueOnce(new Error("Database error"));
			const app = express();
			app.use(express.json());
			app.use(jobRoleRouter);

			const newJobRole = {
				roleName: "Test Role",
				description: "Test description",
				sharepointUrl: "https://sharepoint.test",
				responsibilities: "Test responsibilities",
				numberOfOpenPositions: 5,
				location: "Belfast",
				closingDate: "2026-12-31",
				capabilityId: "cap-1",
				bandId: "band-1",
			};

			const response = await request(app).post("/job-roles").send(newJobRole);

			expect(response.status).toBe(500);
		});
	});
});

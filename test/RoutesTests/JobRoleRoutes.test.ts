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
	let getAllStatusesSpy: ReturnType<typeof vi.spyOn>;
	let updateJobRoleSpy: ReturnType<typeof vi.spyOn>;

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

	const mockStatusesResponse = [
		{
			statusId: "880e8400-e29b-41d4-a716-446655440003",
			statusName: "Open",
		},
		{
			statusId: "880e8400-e29b-41d4-a716-446655440004",
			statusName: "Closed",
		},
		{
			statusId: "880e8400-e29b-41d4-a716-446655440005",
			statusName: "In Progress",
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
		getAllStatusesSpy = vi.spyOn(JobRoleDao.prototype, "getAllStatuses");
		updateJobRoleSpy = vi.spyOn(JobRoleDao.prototype, "updateJobRole");
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
			expect(response.body.error).toBe("Role name is required");
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
			expect(response.body.error).toBe("Invalid SharePoint URL format");
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
			expect(response.body.error).toBe("Closing date must be in the future");
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

	describe("GET /statuses", () => {
		it("should return 200 and list of statuses", async () => {
			getAllStatusesSpy.mockResolvedValue(mockStatusesResponse);

			const app = express();
			app.use(express.json());
			app.use(jobRoleRouter);

			const response = await request(app).get("/statuses");

			expect(response.status).toBe(200);
			expect(response.body).toEqual(mockStatusesResponse);
			expect(getAllStatusesSpy).toHaveBeenCalledOnce();
		});

		it("should return 500 when DAO throws an error", async () => {
			getAllStatusesSpy.mockRejectedValue(new Error("Database error"));

			const app = express();
			app.use(express.json());
			app.use(jobRoleRouter);

			const response = await request(app).get("/statuses");

			expect(response.status).toBe(500);
		});

		it("should return empty array when no statuses exist", async () => {
			getAllStatusesSpy.mockResolvedValue([]);

			const app = express();
			app.use(express.json());
			app.use(jobRoleRouter);

			const response = await request(app).get("/statuses");

			expect(response.status).toBe(200);
			expect(response.body).toEqual([]);
		});
	});

	describe("PUT /job-roles/:id", () => {
		const validUpdateData = {
			roleName: "Updated Software Engineer",
			location: "London",
		};

		it("should return 200 and updated job role on successful update", async () => {
			const mockUpdatedJobRole = {
				...mockDaoResponse[0],
				roleName: "Updated Software Engineer",
				location: "London",
			};

			updateJobRoleSpy.mockResolvedValue(mockUpdatedJobRole);

			const app = express();
			app.use(express.json());
			app.use(jobRoleRouter);

			const response = await request(app)
				.put("/job-roles/550e8400-e29b-41d4-a716-446655440000")
				.send(validUpdateData);

			expect(response.status).toBe(200);
			expect(response.body.roleName).toBe("Updated Software Engineer");
			expect(response.body.location).toBe("London");
			expect(updateJobRoleSpy).toHaveBeenCalledWith(
				"550e8400-e29b-41d4-a716-446655440000",
				expect.objectContaining({
					roleName: "Updated Software Engineer",
					location: "London",
				}),
			);
		});

		it("should return 404 when job role not found", async () => {
			updateJobRoleSpy.mockResolvedValue(null);

			const app = express();
			app.use(express.json());
			app.use(jobRoleRouter);

			const response = await request(app)
				.put("/job-roles/non-existent-id")
				.send(validUpdateData);

			expect(response.status).toBe(404);
			expect(response.body).toEqual({ error: "Job role not found" });
		});

		it("should return 400 when no fields provided", async () => {
			const app = express();
			app.use(express.json());
			app.use(jobRoleRouter);

			const response = await request(app)
				.put("/job-roles/550e8400-e29b-41d4-a716-446655440000")
				.send({});

			expect(response.status).toBe(400);
			expect(response.body).toEqual({ error: "No fields to update" });
		});

		it("should return 400 when role name is empty", async () => {
			const app = express();
			app.use(express.json());
			app.use(jobRoleRouter);

			const response = await request(app)
				.put("/job-roles/550e8400-e29b-41d4-a716-446655440000")
				.send({ roleName: "" });

			expect(response.status).toBe(400);
			expect(response.body).toEqual({ error: "Role name cannot be empty" });
		});

		it("should return 400 when SharePoint URL is invalid", async () => {
			const app = express();
			app.use(express.json());
			app.use(jobRoleRouter);

			const response = await request(app)
				.put("/job-roles/550e8400-e29b-41d4-a716-446655440000")
				.send({ sharepointUrl: "not-a-valid-url" });

			expect(response.status).toBe(400);
			expect(response.body).toEqual({ error: "Invalid SharePoint URL format" });
		});

		it("should return 400 when numberOfOpenPositions is less than 1", async () => {
			const app = express();
			app.use(express.json());
			app.use(jobRoleRouter);

			const response = await request(app)
				.put("/job-roles/550e8400-e29b-41d4-a716-446655440000")
				.send({ numberOfOpenPositions: 0 });

			expect(response.status).toBe(400);
			expect(response.body).toEqual({
				error: "Number of open positions must be at least 1",
			});
		});

		it("should return 400 when closing date is in the past", async () => {
			const app = express();
			app.use(express.json());
			app.use(jobRoleRouter);

			const response = await request(app)
				.put("/job-roles/550e8400-e29b-41d4-a716-446655440000")
				.send({ closingDate: "2025-01-01" });

			expect(response.status).toBe(400);
			expect(response.body).toEqual({
				error: "Closing date must be in the future",
			});
		});

		it("should return 400 when closing date format is invalid", async () => {
			const app = express();
			app.use(express.json());
			app.use(jobRoleRouter);

			const response = await request(app)
				.put("/job-roles/550e8400-e29b-41d4-a716-446655440000")
				.send({ closingDate: "not-a-date" });

			expect(response.status).toBe(400);
			expect(response.body).toEqual({ error: "Invalid closing date format" });
		});

		it("should handle partial update with valid data", async () => {
			const mockUpdatedJobRole = {
				...mockDaoResponse[0],
				numberOfOpenPositions: 10,
			};

			updateJobRoleSpy.mockResolvedValue(mockUpdatedJobRole);

			const app = express();
			app.use(express.json());
			app.use(jobRoleRouter);

			const response = await request(app)
				.put("/job-roles/550e8400-e29b-41d4-a716-446655440000")
				.send({ numberOfOpenPositions: 10 });

			expect(response.status).toBe(200);
			expect(response.body.numberOfOpenPositions).toBe(10);
		});

		it("should return 400 when DAO throws foreign key constraint error", async () => {
			updateJobRoleSpy.mockRejectedValue(
				new Error("Foreign key constraint failed"),
			);

			const app = express();
			app.use(express.json());
			app.use(jobRoleRouter);

			const response = await request(app)
				.put("/job-roles/550e8400-e29b-41d4-a716-446655440000")
				.send({ statusId: "invalid-id" });

			expect(response.status).toBe(400);
			expect(response.body).toEqual({
				error: "Invalid capability, band, or status selected",
			});
		});

		it("should return 500 when DAO throws unexpected error", async () => {
			updateJobRoleSpy.mockRejectedValue(
				new Error("Unexpected database error"),
			);

			const app = express();
			app.use(express.json());
			app.use(jobRoleRouter);

			const response = await request(app)
				.put("/job-roles/550e8400-e29b-41d4-a716-446655440000")
				.send(validUpdateData);

			expect(response.status).toBe(500);
			expect(response.body).toEqual({ error: "Internal server error" });
		});
	});

	describe("DELETE /job-roles/:id", () => {
		let deleteJobRoleSpy: ReturnType<typeof vi.spyOn>;

		beforeEach(() => {
			deleteJobRoleSpy = vi
				.spyOn(JobRoleDao.prototype, "deleteJobRole")
				.mockResolvedValue(mockDaoResponse[0]);
		});

		it("should return 204 when job role is successfully deleted", async () => {
			const app = buildApp();

			const response = await request(app).delete(
				"/job-roles/550e8400-e29b-41d4-a716-446655440000",
			);

			expect(response.status).toBe(204);
			expect(response.body).toEqual({});
			expect(deleteJobRoleSpy).toHaveBeenCalledWith(
				"550e8400-e29b-41d4-a716-446655440000",
			);
		});

		it("should return 404 when job role does not exist", async () => {
			deleteJobRoleSpy.mockResolvedValueOnce(null);
			const app = buildApp();

			const response = await request(app).delete(
				"/job-roles/550e8400-e29b-41d4-a716-446655440000",
			);

			expect(response.status).toBe(404);
			expect(response.body).toEqual({ error: "Job role not found" });
		});

		it("should return 500 when the DAO throws an error", async () => {
			deleteJobRoleSpy.mockRejectedValueOnce(new Error("Database error"));
			const app = buildApp();

			const response = await request(app).delete(
				"/job-roles/550e8400-e29b-41d4-a716-446655440000",
			);

			expect(response.status).toBe(500);
			expect(response.body).toEqual({ error: "Internal server error" });
		});
	});
});

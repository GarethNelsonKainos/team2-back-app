import type { CreateJobRoleInput } from "../../daos/job-role.dao.js";

interface CreateJobRoleBody {
	roleName?: unknown;
	description?: unknown;
	sharepointUrl?: unknown;
	responsibilities?: unknown;
	numberOfOpenPositions?: unknown;
	location?: unknown;
	closingDate?: unknown;
	capabilityId?: unknown;
	bandId?: unknown;
}

type ValidationResult =
	| { errors: string[]; input?: undefined }
	| { errors: []; input: CreateJobRoleInput };

type RequiredStringField = Exclude<
	keyof CreateJobRoleInput,
	"numberOfOpenPositions" | "closingDate"
>;

const REQUIRED_STRING_FIELDS: Array<{
	field: RequiredStringField;
	message: string;
}> = [
	{ field: "roleName", message: "Role name is required" },
	{ field: "description", message: "Job spec summary is required" },
	{ field: "sharepointUrl", message: "SharePoint link is required" },
	{ field: "responsibilities", message: "Responsibilities are required" },
	{ field: "location", message: "Location is required" },
	{ field: "capabilityId", message: "Capability is required" },
	{ field: "bandId", message: "Band is required" },
];

const NUMBER_OF_OPEN_POSITIONS_ERROR =
	"Number of open positions must be at least 1";

const CLOSING_DATE_REQUIRED_ERROR = "Closing date is required";

function getTrimmedString(value: unknown): string {
	return typeof value === "string" ? value.trim() : "";
}

function hasMissingRequiredFields(body: CreateJobRoleBody): string[] {
	const errors: string[] = [];

	for (const { field, message } of REQUIRED_STRING_FIELDS) {
		if (!getTrimmedString(body[field])) {
			errors.push(message);
		}
	}

	const openPositionsValue = body.numberOfOpenPositions;
	if (
		openPositionsValue === undefined ||
		openPositionsValue === null ||
		(typeof openPositionsValue === "string" && openPositionsValue.trim() === "")
	) {
		errors.push(NUMBER_OF_OPEN_POSITIONS_ERROR);
	}

	if (!getTrimmedString(body.closingDate)) {
		errors.push(CLOSING_DATE_REQUIRED_ERROR);
	}

	return errors;
}

function hasValidSharepointUrl(sharepointUrl: string): boolean {
	try {
		const parsedUrl = new URL(sharepointUrl);
		return parsedUrl.protocol === "http:" || parsedUrl.protocol === "https:";
	} catch {
		return false;
	}
}

function parseAndValidateClosingDate(closingDateString: string): {
	date?: Date;
	error?: string;
} {
	const closingDate = new Date(closingDateString);
	if (Number.isNaN(closingDate.getTime())) {
		return { error: "Invalid closing date format" };
	}

	const today = new Date();
	today.setHours(0, 0, 0, 0);
	closingDate.setHours(0, 0, 0, 0);

	if (closingDate <= today) {
		return { error: "Closing date must be in the future" };
	}

	return { date: closingDate };
}

function parseAndValidateOpenPositions(value: unknown): {
	numberOfOpenPositions?: number;
	error?: string;
} {
	const numberOfOpenPositions = Number(value);
	if (
		Number.isNaN(numberOfOpenPositions) ||
		!Number.isFinite(numberOfOpenPositions) ||
		numberOfOpenPositions < 1 ||
		!Number.isInteger(numberOfOpenPositions)
	) {
		return { error: NUMBER_OF_OPEN_POSITIONS_ERROR };
	}

	return { numberOfOpenPositions };
}

export function validateAndBuildCreateJobRoleInput(
	body: CreateJobRoleBody,
): ValidationResult {
	const missingRequiredErrors = hasMissingRequiredFields(body);
	if (missingRequiredErrors.length > 0) {
		return { errors: missingRequiredErrors };
	}

	const roleName = getTrimmedString(body.roleName);
	const description = getTrimmedString(body.description);
	const sharepointUrl = getTrimmedString(body.sharepointUrl);
	const responsibilities = getTrimmedString(body.responsibilities);
	const location = getTrimmedString(body.location);
	const capabilityId = getTrimmedString(body.capabilityId);
	const bandId = getTrimmedString(body.bandId);
	const closingDateString = getTrimmedString(body.closingDate);

	const errors: string[] = [];

	if (!hasValidSharepointUrl(sharepointUrl)) {
		errors.push("Invalid SharePoint URL format");
	}

	const { numberOfOpenPositions, error: openPositionsError } =
		parseAndValidateOpenPositions(body.numberOfOpenPositions);
	if (openPositionsError) {
		errors.push(openPositionsError);
	}

	const { date: closingDate, error: closingDateError } =
		parseAndValidateClosingDate(closingDateString);
	if (closingDateError) {
		errors.push(closingDateError);
	}

	if (errors.length > 0) {
		return { errors };
	}

	return {
		errors: [],
		input: {
			roleName,
			description,
			sharepointUrl,
			responsibilities,
			numberOfOpenPositions: numberOfOpenPositions as number,
			location,
			closingDate: closingDate as Date,
			capabilityId,
			bandId,
		},
	};
}

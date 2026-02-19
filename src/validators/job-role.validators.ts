export function validateStringField(
	value: string | undefined,
	fieldName: string,
	required: boolean,
): string | null {
	if (required) {
		if (!value || !value.trim()) {
			return `${fieldName} is required`;
		}
	} else {
		if (value !== undefined && !value.trim()) {
			return `${fieldName} cannot be empty`;
		}
	}
	return null;
}

export function validateSharePointUrl(
	url: string | undefined,
	required: boolean,
): string | null {
	// First check if it's required/provided
	if (required && (!url || !url.trim())) {
		return "SharePoint link is required";
	}
	if (!required && url !== undefined && !url.trim()) {
		return "SharePoint link cannot be empty";
	}

	// If URL is provided, validate its format
	if (url && url.trim()) {
		try {
			const parsedUrl = new URL(url);
			if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
				return "Invalid SharePoint URL format";
			}
		} catch {
			return "Invalid SharePoint URL format";
		}
	}

	return null;
}

export function validateClosingDate(
	date: string | undefined,
	required: boolean,
): { error: string | null; parsedDate?: Date } {
	if (required && !date) {
		return { error: "Closing date is required" };
	}
	if (date !== undefined) {
		const closingDate = new Date(date);
		if (Number.isNaN(closingDate.getTime())) {
			return { error: "Invalid closing date format" };
		}
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		closingDate.setHours(0, 0, 0, 0);
		if (closingDate <= today) {
			return { error: "Closing date must be in the future" };
		}
		return { error: null, parsedDate: closingDate };
	}
	return { error: null };
}

export function validateNumberOfOpenPositions(
	count: number | undefined,
	required: boolean,
): string | null {
	if (required && count === undefined) {
		return "Number of open positions is required";
	}
	if (count !== undefined && (!Number.isInteger(count) || count < 1)) {
		return "Number of open positions must be at least 1";
	}
	return null;
}

import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface AuthRequest extends Request {
	user?: {
		userId: string;
		firstName: string;
		secondName: string;
		email: string;
		role: string;
	};
}

export const authenticateToken = (
	req: AuthRequest,
	res: Response,
	next: NextFunction,
): void => {
	// Get token from Authorisation header
	const authHeader = req.headers.authorization;
	const token = authHeader?.split(" ")[1]; // Bearer <token>

	if (!token) {
		res.status(401).json({ error: "Access token required" });
		return;
	}

	try {
		if (!process.env.JWT_SECRET) {
			res.status(500).json({ error: "Server configuration error" });
			return;
		}

		//Verify and decode token
		const decoded = jwt.verify(token, process.env.JWT_SECRET) as {
			userId: string;
			firstName: string;
			secondName: string;
			email: string;
			role: string;
		};

		// Attach user info to request object
		req.user = decoded;
		next();
	} catch (_error) {
		res.status(403).json({ error: "Invalid or expired token" });
	}
};

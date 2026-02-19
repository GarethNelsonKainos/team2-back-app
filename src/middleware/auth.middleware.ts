import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import UserRole from "../types/UserRole";

export interface AuthRequest extends Request {
	user?: {
		userId: string;
		firstName: string;
		secondName: string;
		email: string;
		role: string;
	};
}

export default function authorisedRoles(allowedRoles: UserRole[]) {
	return (req: AuthRequest, res: Response, next: NextFunction) => {
		if (!process.env.JWT_SECRET) {
			res.status(500).json({ error: "Server configuration error" });
			return;
		}

		const authHeader = req.headers.authorization;
		const token = authHeader?.split(" ")[1];

		if (!token) {
			res.status(401).json({ error: "Access token required" });
			return;
		}

		try {
			const decoded = jwt.verify(token, process.env.JWT_SECRET) as {
				userId: string;
				firstName: string;
				secondName: string;
				email: string;
				role: UserRole;
			};

			const tokenRole = decoded.role;
			if(!allowedRoles.includes(tokenRole)) {
				res.sendStatus(403);
				return;
			}

			res.locals.user = decoded;
			next();
		} catch (error) {
			console.error("Token verification failed:", error);
			res.status(500).json({ error: "Invalid or expired token" });
		}

	};
}

export const authenticateToken = (
	req: AuthRequest,
	res: Response,
	next: NextFunction,
): void => {
	// Get token from Authorisation header
	
};

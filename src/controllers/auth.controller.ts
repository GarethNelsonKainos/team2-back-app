import type { Request, Response } from "express";
import { AuthService } from "../services/auth.service.js";

export class AuthController {
	private authService = new AuthService();

	async login(req: Request, res: Response): Promise<void> {
		try {
			const { email, password } = req.body;

			// Validate request body

			if (!email || !password) {
				res.status(400).json({ error: "Email and password are required" });
				return;
			}

			// Basic email format validation
			const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
			if (!emailRegex.test(email)) {
				res.status(400).json({ error: "Invalid email format" });
				return;
			}

			// Attempt login
			const result = await this.authService.login(email, password);

			res.status(200).json(result);
		} catch (error) {
			console.error("Login error:", error);

			const isAuthError =
				error instanceof Error &&
				(error.name === "AuthError" || error.message === "Invalid credentials");

			if (isAuthError) {
				res.status(401).json({ error: "Invalid credentials" });
			} else {
				res.status(500).json({ error: "Internal server error" });
			}
		}
	}
}

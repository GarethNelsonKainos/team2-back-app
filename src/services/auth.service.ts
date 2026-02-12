import argon2 from "argon2";
import jwt, { type SignOptions } from "jsonwebtoken";
import { AuthDao } from "../daos/auth.dao.js";

export class AuthService {
	private authDao: AuthDao = new AuthDao();

	async login(email: string, password: string): Promise<{ token: string }> {
		// Find the user by email
		const user = await this.authDao.findUserByEmail(email);

		if (!user) {
			throw new Error("Invalid credentials");
		}

		// Verify the password with Argon2
		const isPasswordValid = await argon2.verify(user.password, password);

		if (!isPasswordValid) {
			throw new Error("Invalid credentials");
		}

		// Generate a JWT token
		const secret = process.env.JWT_SECRET;
		if (!secret) {
			throw new Error("JWT_SECRET environment variable is not defined");
		}

		const token = jwt.sign(
			{
				userId: user.userId,
				firstName: user.firstName,
				secondName: user.secondName,
				email: user.email,
				role: user.role,
			},
			secret,
			{ expiresIn: process.env.JWT_EXPIRES_IN || "24h" } as SignOptions,
		);

		return { token };
	}
}

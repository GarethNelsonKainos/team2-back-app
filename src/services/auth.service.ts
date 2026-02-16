import argon2 from "argon2";
import jwt, { type SignOptions } from "jsonwebtoken";
import { AuthDao } from "../daos/auth.dao.js";

export class AuthService {
	private authDao: AuthDao = new AuthDao();

	private validatePassword(password: string): void {
		if (password.length < 9) {
			throw new Error("Password must be more than 8 characters");
		}

		if (!/[a-z]/.test(password)) {
			throw new Error("Password must contain lowercase letters");
		}

		if (!/[A-Z]/.test(password)) {
			throw new Error("Password must contain uppercase letters");
		}

		if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
			throw new Error("Password must contain special characters");
		}
	}

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

	async register(userData: {
		email: string;
		firstName: string;
		secondName: string;
		password: string;
		confirmedPassword: string;
	}): Promise<{ token: string }> {
		// Check if passwords match
		if (userData.password !== userData.confirmedPassword) {
			throw new Error("Passwords do not match");
		}

		// Validate password format
		this.validatePassword(userData.password);

		// Check if user already exists
		const existingUser = await this.authDao.findUserByEmail(userData.email);
		if (existingUser) {
			throw new Error("User with this email already exists");
		}

		// Hash the password with Argon2
		const hashedPassword = await argon2.hash(userData.password);

		// Create the user
		const newUser = await this.authDao.createUser({
			email: userData.email,
			firstName: userData.firstName,
			secondName: userData.secondName,
			password: hashedPassword,
		});

		// Generate a JWT token
		const secret = process.env.JWT_SECRET;
		if (!secret) {
			throw new Error("JWT_SECRET environment variable is not defined");
		}

		const token = jwt.sign(
			{
				userId: newUser.userId,
				firstName: newUser.firstName,
				secondName: newUser.secondName,
				email: newUser.email,
				role: newUser.role,
			},
			secret,
			{ expiresIn: process.env.JWT_EXPIRES_IN || "24h" } as SignOptions,
		);

		return { token };
	}
}

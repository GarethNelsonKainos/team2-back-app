import type { User } from "../generated/prisma/client.js";
import { prisma } from "./prisma.js";

export class AuthDao {
	async findUserByEmail(email: string): Promise<User | null> {
		return prisma.user.findUnique({
			where: { email },
		});
	}

	async createUser(userData: {
		email: string;
		firstName: string;
		secondName: string;
		password: string;
	}): Promise<User> {
		return prisma.user.create({
			data: {
				email: userData.email,
				firstName: userData.firstName,
				secondName: userData.secondName,
				password: userData.password,
				// role defaults to 'user' as per schema
			},
		});
	}
}

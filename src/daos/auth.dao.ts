import type { User } from "../generated/prisma/client.js";
import { prisma } from "./prisma.js";

export class AuthDao {
	async findUserByEmail(email: string): Promise<User | null> {
		return prisma.user.findUnique({
			where: { email },
		});
	}
}

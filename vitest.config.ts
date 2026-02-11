import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		environment: "node",
		coverage: {
			provider: "v8",
			reporter: ["text", "json", "html", "lcov"],
			thresholds: {
				lines: 80,
				functions: 80,
				branches: 80,
				statements: 80,
			},
			exclude: [
				"node_modules/",
				"generated/prisma/",
				"dist/",
				"coverage/",
				"**/*.config.ts",
				"**/*.config.js",
				"**/types.ts",
				"**/types/**",
				"**/*.d.ts",
				"**/index.ts",
				"src/config/**",
			],
		},
		reporters: ["verbose"],
		clearMocks: true,
	},
});

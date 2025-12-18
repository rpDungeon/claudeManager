import { defineConfig } from "drizzle-kit";

export default defineConfig({
	dbCredentials: {
		url: process.env.DATABASE_PATH || "./data/claude-manager.db",
	},
	dialect: "sqlite",
	out: "./drizzle",
	schema: "./src/db/db.schema.ts",
});

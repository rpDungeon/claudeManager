import { resolve } from "node:path";

Bun.env.DATABASE_PATH = ":memory:";

const { migrate } = await import("drizzle-orm/bun-sqlite/migrator");
const { db } = await import("../db/db.client");

const migrationsPath = resolve(import.meta.dir, "../../drizzle");
migrate(db, {
	migrationsFolder: migrationsPath,
});

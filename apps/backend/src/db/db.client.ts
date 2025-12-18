import { Database } from "bun:sqlite";
import { existsSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { drizzle } from "drizzle-orm/bun-sqlite";

import { dbSchemas } from "./db.schema";

const dataDir = dirname(Bun.env.DATABASE_PATH);
if (!existsSync(dataDir)) {
	mkdirSync(dataDir, {
		recursive: true,
	});
}

const sqlite = new Database(Bun.env.DATABASE_PATH, {
	strict: true,
});

sqlite.run("PRAGMA journal_mode = WAL");

export const db = drizzle(sqlite, {
	schema: dbSchemas,
});

export type DbClient = typeof db;
export type DbTransaction = Parameters<typeof db.transaction>[0];

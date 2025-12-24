import { Database } from "bun:sqlite";
import { existsSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { drizzle } from "drizzle-orm/bun-sqlite";

import "../common/common.env";
import { dbSchemas } from "./db.schema";

const dbPath = Bun.env.DATABASE_PATH;

const isInMemory = dbPath === ":memory:";
const resolvedPath = isInMemory ? ":memory:" : resolve(dbPath);

if (!isInMemory) {
	const dataDir = dirname(resolvedPath);
	if (!existsSync(dataDir)) {
		mkdirSync(dataDir, {
			recursive: true,
		});
	}
}

const sqlite = new Database(resolvedPath, {
	strict: true,
});

sqlite.run("PRAGMA journal_mode = WAL");

export const db = drizzle(sqlite, {
	schema: dbSchemas,
});

export type DbClient = typeof db;
export type DbTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

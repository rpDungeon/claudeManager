import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

import { type ProjectId, projectIdGenerate } from "./project.types";

export const projectSchema = sqliteTable("projects", {
	createdAt: integer("created_at", {
		mode: "timestamp",
	})
		.notNull()
		.$defaultFn(() => new Date()),
	id: text("id").primaryKey().$defaultFn(projectIdGenerate).$type<ProjectId>(),
	name: text("name").notNull(),
	path: text("path").notNull(),
	updatedAt: integer("updated_at", {
		mode: "timestamp",
	})
		.notNull()
		.$defaultFn(() => new Date()),
});

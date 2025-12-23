import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

import { type LayoutId, layoutIdGenerate } from "./layout.id";
import type { LayoutData } from "./layout.types";

export const layoutSchema = sqliteTable("layouts", {
	createdAt: integer("created_at", {
		mode: "timestamp",
	})
		.notNull()
		.$defaultFn(() => new Date()),
	data: text("data", {
		mode: "json",
	}).$type<LayoutData>(),
	id: text("id").primaryKey().$defaultFn(layoutIdGenerate).$type<LayoutId>(),
	name: text("name").notNull(),
	updatedAt: integer("updated_at", {
		mode: "timestamp",
	})
		.notNull()
		.$defaultFn(() => new Date()),
});

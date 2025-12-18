import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

import { type LayoutArrangement, type LayoutId, layoutIdGenerate } from "./layout.types";

export const layoutSchema = sqliteTable("layouts", {
	createdAt: integer("created_at", {
		mode: "timestamp",
	})
		.notNull()
		.$defaultFn(() => new Date()),
	desktop: text("desktop", {
		mode: "json",
	}).$type<LayoutArrangement>(),
	id: text("id").primaryKey().$defaultFn(layoutIdGenerate).$type<LayoutId>(),
	mobile: text("mobile", {
		mode: "json",
	}).$type<LayoutArrangement>(),
	name: text("name").notNull(),
	updatedAt: integer("updated_at", {
		mode: "timestamp",
	})
		.notNull()
		.$defaultFn(() => new Date()),
});

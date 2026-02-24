import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

import { type TerminalShortcutId, terminalShortcutIdGenerate } from "./terminalShortcut.id";

export const terminalShortcutSchema = sqliteTable("terminal_shortcuts", {
	color: text("color"),
	command: text("command").notNull(),
	createdAt: integer("created_at", {
		mode: "timestamp",
	})
		.notNull()
		.$defaultFn(() => new Date()),
	id: text("id").primaryKey().$defaultFn(terminalShortcutIdGenerate).$type<TerminalShortcutId>(),
	label: text("label").notNull(),
	sendCtrlC: integer("send_ctrl_c", {
		mode: "boolean",
	})
		.notNull()
		.default(false),
	sendEnter: integer("send_enter", {
		mode: "boolean",
	})
		.notNull()
		.default(false),
	sortOrder: integer("sort_order").notNull().default(0),
});

import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { customAlphabet } from "nanoid";

import { terminalSchema } from "./terminal.schema";
import type { TerminalId } from "./terminal.types";

const generateId = customAlphabet("0123456789abcdefghijklmnopqrstuvwxyz", 21);

export const terminalInputLogSchema = sqliteTable("terminal_input_logs", {
	id: text("id").primaryKey().$defaultFn(generateId),
	input: text("input").notNull(),
	terminalId: text("terminal_id")
		.notNull()
		.references(() => terminalSchema.id, {
			onDelete: "cascade",
		})
		.$type<TerminalId>(),
	timestamp: integer("timestamp", {
		mode: "timestamp",
	})
		.notNull()
		.$defaultFn(() => new Date()),
});

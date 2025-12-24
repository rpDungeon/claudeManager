import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

import type { ClaudeSessionId } from "../claude/session/claudeSession.id";
import { claudeSessionSchema } from "../claude/session/claudeSession.schema";
import type { ProjectId } from "../project/project.id";
import { projectSchema } from "../project/project.schema";
import { type TerminalId, TerminalType, terminalIdGenerate } from "./terminal.types";

export const terminalSchema = sqliteTable("terminals", {
	claudeSessionId: text("claude_session_id")
		.references(() => claudeSessionSchema.id, {
			onDelete: "set null",
		})
		.$type<ClaudeSessionId | null>(),
	createdAt: integer("created_at", {
		mode: "timestamp",
	})
		.notNull()
		.$defaultFn(() => new Date()),
	id: text("id").primaryKey().$defaultFn(terminalIdGenerate).$type<TerminalId>(),
	layoutConfig: text("layout_config"),
	name: text("name").notNull(),
	projectId: text("project_id")
		.notNull()
		.references(() => projectSchema.id, {
			onDelete: "cascade",
		})
		.$type<ProjectId>(),
	type: text("type", {
		enum: [
			TerminalType.Shell,
			TerminalType.Claude,
		],
	})
		.notNull()
		.$type<TerminalType>(),
});

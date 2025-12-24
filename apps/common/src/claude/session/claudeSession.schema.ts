import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

import type { ProjectId } from "../../project/project.id";
import { projectSchema } from "../../project/project.schema";
import { type ClaudeSessionExternalId, type ClaudeSessionId, claudeSessionIdGenerate } from "./claudeSession.id";
import { ClaudeSessionStatus } from "./claudeSession.types";

export const claudeSessionSchema = sqliteTable("claude_sessions", {
	createdAt: integer("created_at", {
		mode: "timestamp",
	})
		.notNull()
		.$defaultFn(() => new Date()),
	description: text("description"),
	externalSessionId: text("external_session_id").notNull().unique().$type<ClaudeSessionExternalId>(),
	id: text("id").primaryKey().$defaultFn(claudeSessionIdGenerate).$type<ClaudeSessionId>(),
	lastActiveAt: integer("last_active_at", {
		mode: "timestamp",
	})
		.notNull()
		.$defaultFn(() => new Date()),
	name: text("name"),
	projectId: text("project_id")
		.notNull()
		.references(() => projectSchema.id, {
			onDelete: "cascade",
		})
		.$type<ProjectId>(),
	status: text("status", {
		enum: [
			ClaudeSessionStatus.Active,
			ClaudeSessionStatus.Idle,
			ClaudeSessionStatus.Paused,
			ClaudeSessionStatus.Completed,
			ClaudeSessionStatus.Error,
		],
	})
		.notNull()
		.default(ClaudeSessionStatus.Active)
		.$type<ClaudeSessionStatus>(),
});

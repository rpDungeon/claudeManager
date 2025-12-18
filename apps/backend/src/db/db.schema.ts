import { claudeSessionSchema } from "@claude-manager/common/src/claude/session/claudeSession.schema";
import { projectSchema } from "@claude-manager/common/src/project/project.schema";
import { terminalSchema } from "@claude-manager/common/src/terminal/terminal.schema";
import { relations } from "drizzle-orm";

export const dbProjectsRelations = relations(projectSchema, ({ many }) => ({
	claudeSessions: many(claudeSessionSchema),
	terminals: many(terminalSchema),
}));

export const dbClaudeSessionsRelations = relations(claudeSessionSchema, ({ many, one }) => ({
	project: one(projectSchema, {
		fields: [
			claudeSessionSchema.projectId,
		],
		references: [
			projectSchema.id,
		],
	}),
	terminals: many(terminalSchema),
}));

export const dbTerminalsRelations = relations(terminalSchema, ({ one }) => ({
	claudeSession: one(claudeSessionSchema, {
		fields: [
			terminalSchema.claudeSessionId,
		],
		references: [
			claudeSessionSchema.id,
		],
	}),
	project: one(projectSchema, {
		fields: [
			terminalSchema.projectId,
		],
		references: [
			projectSchema.id,
		],
	}),
}));

export const dbSchemas = {
	claudeSession: claudeSessionSchema,
	dbClaudeSessionsRelations,
	dbProjectsRelations,
	dbTerminalsRelations,
	project: projectSchema,
	terminal: terminalSchema,
} as const;

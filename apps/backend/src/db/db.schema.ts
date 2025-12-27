import { claudeSessionSchema } from "@claude-manager/common/src/claude/session/claudeSession.schema";
import { layoutSchema } from "@claude-manager/common/src/layout/layout.schema";
import { projectSchema } from "@claude-manager/common/src/project/project.schema";
import { terminalInputLogSchema } from "@claude-manager/common/src/terminal/terminal.inputlog.schema";
import { terminalSchema } from "@claude-manager/common/src/terminal/terminal.schema";
import { relations } from "drizzle-orm";

export { claudeSessionSchema, layoutSchema, projectSchema, terminalInputLogSchema, terminalSchema };

export const projectRelations = relations(projectSchema, ({ many, one }) => ({
	claudeSessions: many(claudeSessionSchema),
	layout: one(layoutSchema, {
		fields: [
			projectSchema.layoutId,
		],
		references: [
			layoutSchema.id,
		],
	}),
	terminals: many(terminalSchema),
}));

export const layoutRelations = relations(layoutSchema, ({ many }) => ({
	projects: many(projectSchema),
}));

export const claudeSessionRelations = relations(claudeSessionSchema, ({ many, one }) => ({
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

export const terminalRelations = relations(terminalSchema, ({ many, one }) => ({
	claudeSession: one(claudeSessionSchema, {
		fields: [
			terminalSchema.claudeSessionId,
		],
		references: [
			claudeSessionSchema.id,
		],
	}),
	inputLogs: many(terminalInputLogSchema),
	project: one(projectSchema, {
		fields: [
			terminalSchema.projectId,
		],
		references: [
			projectSchema.id,
		],
	}),
}));

export const terminalInputLogRelations = relations(terminalInputLogSchema, ({ one }) => ({
	terminal: one(terminalSchema, {
		fields: [
			terminalInputLogSchema.terminalId,
		],
		references: [
			terminalSchema.id,
		],
	}),
}));

export const dbSchemas = {
	claudeSession: claudeSessionSchema,
	claudeSessionRelations,
	layout: layoutSchema,
	layoutRelations,
	project: projectSchema,
	projectRelations,
	terminal: terminalSchema,
	terminalInputLog: terminalInputLogSchema,
	terminalInputLogRelations,
	terminalRelations,
} as const;

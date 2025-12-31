import { z } from "zod";

enum GitFileStatusCodeEnum {
	Added = "A",
	Copied = "C",
	Deleted = "D",
	Ignored = "!",
	Modified = "M",
	Renamed = "R",
	Unmodified = " ",
	Untracked = "?",
	UpdatedButUnmerged = "U",
}

const gitFileEntrySchemaInternal = z.object({
	path: z.string(),
	statusIndex: z.nativeEnum(GitFileStatusCodeEnum),
	statusWorking: z.nativeEnum(GitFileStatusCodeEnum),
});

const gitStatusSchemaInternal = z.object({
	ahead: z.number(),
	behind: z.number(),
	branch: z.string().nullable(),
	files: z.array(gitFileEntrySchemaInternal),
});

enum GitWatchMessageClientTypeEnum {
	Unwatch = "unwatch",
	Watch = "watch",
}

const gitWatchMessageClientWatchSchema = z.object({
	path: z.string(),
	type: z.literal(GitWatchMessageClientTypeEnum.Watch),
});

const gitWatchMessageClientUnwatchSchema = z.object({
	path: z.string(),
	type: z.literal(GitWatchMessageClientTypeEnum.Unwatch),
});

const gitWatchMessageClientSchemaInternal = z.discriminatedUnion("type", [
	gitWatchMessageClientWatchSchema,
	gitWatchMessageClientUnwatchSchema,
]);

enum GitWatchMessageServerTypeEnum {
	Error = "error",
	Status = "status",
	Unwatched = "unwatched",
}

const gitWatchMessageServerStatusSchema = z.object({
	path: z.string(),
	status: gitStatusSchemaInternal,
	type: z.literal(GitWatchMessageServerTypeEnum.Status),
});

const gitWatchMessageServerErrorSchema = z.object({
	message: z.string(),
	path: z.string().optional(),
	type: z.literal(GitWatchMessageServerTypeEnum.Error),
});

const gitWatchMessageServerUnwatchedSchema = z.object({
	path: z.string(),
	type: z.literal(GitWatchMessageServerTypeEnum.Unwatched),
});

const gitWatchMessageServerSchemaInternal = z.discriminatedUnion("type", [
	gitWatchMessageServerStatusSchema,
	gitWatchMessageServerErrorSchema,
	gitWatchMessageServerUnwatchedSchema,
]);

const gitStageRequestSchemaInternal = z.object({
	files: z.array(z.string()),
	path: z.string(),
});

const gitCommitRequestSchemaInternal = z.object({
	message: z.string().min(1),
	path: z.string(),
});

const gitDiffResponseSchemaInternal = z.object({
	diff: z.string(),
	filePath: z.string(),
	staged: z.boolean(),
});

export const GitFileStatusCode = GitFileStatusCodeEnum;
export type GitFileStatusCode = GitFileStatusCodeEnum;

export const gitFileEntrySchema = gitFileEntrySchemaInternal;
export type GitFileEntry = z.infer<typeof gitFileEntrySchemaInternal>;

export const gitStatusSchema = gitStatusSchemaInternal;
export type GitStatus = z.infer<typeof gitStatusSchemaInternal>;

export const GitWatchMessageClientType = GitWatchMessageClientTypeEnum;
export type GitWatchMessageClientType = GitWatchMessageClientTypeEnum;

export const gitWatchMessageClientSchema = gitWatchMessageClientSchemaInternal;
export type GitWatchMessageClient = z.infer<typeof gitWatchMessageClientSchemaInternal>;

export const GitWatchMessageServerType = GitWatchMessageServerTypeEnum;
export type GitWatchMessageServerType = GitWatchMessageServerTypeEnum;

export const gitWatchMessageServerSchema = gitWatchMessageServerSchemaInternal;
export type GitWatchMessageServer = z.infer<typeof gitWatchMessageServerSchemaInternal>;

export const gitStageRequestSchema = gitStageRequestSchemaInternal;
export type GitStageRequest = z.infer<typeof gitStageRequestSchemaInternal>;

export const gitCommitRequestSchema = gitCommitRequestSchemaInternal;
export type GitCommitRequest = z.infer<typeof gitCommitRequestSchemaInternal>;

export const gitDiffResponseSchema = gitDiffResponseSchemaInternal;
export type GitDiffResponse = z.infer<typeof gitDiffResponseSchemaInternal>;

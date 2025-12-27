import { z } from "zod";

export enum FsEntryType {
	Directory = "directory",
	File = "file",
}

export enum FsEntryErrorCode {
	NotFound = "not_found",
	PermissionDenied = "permission_denied",
	Unknown = "unknown",
}

export const fsEntryErrorSchema = z.object({
	code: z.enum(FsEntryErrorCode),
	message: z.string(),
});

export type FsEntryError = z.infer<typeof fsEntryErrorSchema>;

export const fsEntrySchema = z.object({
	error: fsEntryErrorSchema.optional(),
	modifiedAt: z.number(),
	name: z.string(),
	path: z.string(),
	size: z.number(),
	type: z.nativeEnum(FsEntryType),
});

export type FsEntry = z.infer<typeof fsEntrySchema>;

const fsReadFileSchema = z.object({
	content: z.string(),
	modifiedAt: z.number(),
	path: z.string(),
	size: z.number(),
	type: z.literal(FsEntryType.File),
});

const fsReadDirectorySchema = z.object({
	entries: z.array(fsEntrySchema),
	path: z.string(),
	type: z.literal(FsEntryType.Directory),
});

export const fsReadResponseSchema = z.discriminatedUnion("type", [
	fsReadFileSchema,
	fsReadDirectorySchema,
]);

export type FsReadResponse = z.infer<typeof fsReadResponseSchema>;

export enum FsWatchMessageClientType {
	Unwatch = "unwatch",
	Watch = "watch",
}

const fsWatchMessageClientWatchSchema = z.object({
	path: z.string(),
	recursive: z.boolean().optional().default(false),
	type: z.literal(FsWatchMessageClientType.Watch),
});

const fsWatchMessageClientUnwatchSchema = z.object({
	path: z.string(),
	type: z.literal(FsWatchMessageClientType.Unwatch),
});

export const fsWatchMessageClientSchema = z.discriminatedUnion("type", [
	fsWatchMessageClientWatchSchema,
	fsWatchMessageClientUnwatchSchema,
]);

export type FsWatchMessageClient = z.infer<typeof fsWatchMessageClientSchema>;

export enum FsWatchMessageServerType {
	Change = "change",
	Error = "error",
	Initial = "initial",
	Unwatched = "unwatched",
}

export enum FsWatchEventType {
	Create = "create",
	Delete = "delete",
	Modify = "modify",
	Rename = "rename",
}

const fsWatchMessageServerInitialSchema = z.object({
	entries: z.array(fsEntrySchema),
	path: z.string(),
	type: z.literal(FsWatchMessageServerType.Initial),
});

const fsWatchMessageServerChangeSchema = z.object({
	entry: fsEntrySchema.optional(),
	event: z.nativeEnum(FsWatchEventType),
	path: z.string(),
	type: z.literal(FsWatchMessageServerType.Change),
});

const fsWatchMessageServerErrorSchema = z.object({
	message: z.string(),
	path: z.string().optional(),
	type: z.literal(FsWatchMessageServerType.Error),
});

const fsWatchMessageServerUnwatchedSchema = z.object({
	path: z.string(),
	type: z.literal(FsWatchMessageServerType.Unwatched),
});

export const fsWatchMessageServerSchema = z.discriminatedUnion("type", [
	fsWatchMessageServerInitialSchema,
	fsWatchMessageServerChangeSchema,
	fsWatchMessageServerErrorSchema,
	fsWatchMessageServerUnwatchedSchema,
]);

export type FsWatchMessageServer = z.infer<typeof fsWatchMessageServerSchema>;

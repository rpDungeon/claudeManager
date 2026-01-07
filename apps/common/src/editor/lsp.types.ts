import { z } from "zod";

export enum EditorLspLanguageId {
	TypeScript = "typescript",
	JavaScript = "javascript",
	Python = "python",
	Svelte = "svelte",
	CSS = "css",
	HTML = "html",
	JSON = "json",
}

const editorLspMessageInitializeSchema = z.object({
	languageId: z.nativeEnum(EditorLspLanguageId),
	rootUri: z.string(),
	type: z.literal("initialize"),
});

const editorLspMessageJsonRpcSchema = z.object({
	content: z.string(),
	type: z.literal("jsonrpc"),
});

const editorLspMessagePongSchema = z.object({
	type: z.literal("pong"),
});

export const editorLspMessageClientSchema = z.discriminatedUnion("type", [
	editorLspMessageInitializeSchema,
	editorLspMessageJsonRpcSchema,
	editorLspMessagePongSchema,
]);

export type EditorLspMessageClient = z.infer<typeof editorLspMessageClientSchema>;

export enum EditorLspMessageServerType {
	Ready = "ready",
	JsonRpc = "jsonrpc",
	Error = "error",
	Ping = "ping",
}

const editorLspMessageServerReadySchema = z.object({
	type: z.literal(EditorLspMessageServerType.Ready),
});

const editorLspMessageServerJsonRpcSchema = z.object({
	content: z.string(),
	type: z.literal(EditorLspMessageServerType.JsonRpc),
});

const editorLspMessageServerErrorSchema = z.object({
	message: z.string(),
	type: z.literal(EditorLspMessageServerType.Error),
});

const editorLspMessageServerPingSchema = z.object({
	type: z.literal(EditorLspMessageServerType.Ping),
});

export const editorLspMessageServerSchema = z.discriminatedUnion("type", [
	editorLspMessageServerReadySchema,
	editorLspMessageServerJsonRpcSchema,
	editorLspMessageServerErrorSchema,
	editorLspMessageServerPingSchema,
]);

export type EditorLspMessageServer = z.infer<typeof editorLspMessageServerSchema>;

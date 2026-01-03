import { z } from "zod";

export enum EditorLspLanguageId {
	TypeScript = "typescript",
	JavaScript = "javascript",
	Svelte = "svelte",
	CSS = "css",
	HTML = "html",
	JSON = "json",
}

const editorLspMessageInitializeSchema = z.object({
	type: z.literal("initialize"),
	rootUri: z.string(),
	languageId: z.nativeEnum(EditorLspLanguageId),
});

const editorLspMessageJsonRpcSchema = z.object({
	type: z.literal("jsonrpc"),
	content: z.string(),
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
	type: z.literal(EditorLspMessageServerType.JsonRpc),
	content: z.string(),
});

const editorLspMessageServerErrorSchema = z.object({
	type: z.literal(EditorLspMessageServerType.Error),
	message: z.string(),
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

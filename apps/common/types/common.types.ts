import type { Brand } from "./util.types";

/** Nanoid string type */
export type NanoId = Brand<string, "NanoId">;

/** Project ID type */
export type ProjectId = Brand<NanoId, "ProjectId">;

/** Terminal ID type */
export type TerminalId = Brand<NanoId, "TerminalId">;

/** Session ID type */
export type SessionId = Brand<NanoId, "SessionId">;

/** Claude Chat ID type */
export type ClaudeChatId = Brand<string, "ClaudeChatId">;

/** Unix timestamp (seconds) */
export type UnixTimestamp = Brand<number, "UnixTimestamp">;

/** Terminal types */
export type TerminalType = "shell" | "claude";

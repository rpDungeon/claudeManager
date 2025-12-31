import type { Brand } from "@claude-manager/common/src/types/util.types";
import { z } from "zod";

export type ProxyPort = Brand<number, "ProxyPort">;

const PORT_RANGES = [
	{
		max: 3999,
		min: 3000,
	},
	{
		max: 9999,
		min: 4040,
	},
	{
		max: 5173,
		min: 5173,
	},
	{
		max: 8000,
		min: 8000,
	},
	{
		max: 8080,
		min: 8080,
	},
	{
		max: 8888,
		min: 8888,
	},
] as const;

export function proxyPortIsValid(port: number): port is ProxyPort {
	return PORT_RANGES.some((range) => port >= range.min && port <= range.max);
}

export const proxyPortSchema = z
	.number()
	.int()
	.refine(proxyPortIsValid, {
		message: "Port not in allowed proxy ranges",
	})
	.transform((p) => p as ProxyPort);

const REWRITABLE_CONTENT_TYPES = [
	"text/html",
	"text/javascript",
	"application/javascript",
	"text/css",
	"application/json",
] as const;

type RewritableContentType = (typeof REWRITABLE_CONTENT_TYPES)[number];

export function proxyContentTypeIsRewritable(contentType: string | null): contentType is RewritableContentType {
	if (!contentType) return false;
	const baseType = contentType.split(";")[0].trim();
	return REWRITABLE_CONTENT_TYPES.includes(baseType as RewritableContentType);
}

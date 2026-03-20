export type TerminalStatusLineData = {
	sessionId: string | null;
	branch: string | null;
	model: string | null;
	tokenUsage: string | null;
	cost: string | null;
	resumeId: string | null;
	permissionMode: string | null;
};

const UUID_PATTERN = "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}";

const SESSION_ID_RE = new RegExp(`\\[(${UUID_PATTERN})\\]`, "i");
const RESUME_ID_RE = new RegExp(`--resume\\s+(${UUID_PATTERN})`, "i");
const MODEL_RE = /\|\s*((?:Opus|Sonnet|Haiku)\s+[\d.]+(?:\s*\([^)]+\))?)\s*\|/i;
const TOKEN_RE = /\|\s*(\d+k?\/\d+k?)\s*\|/;
const COST_RE = /(\$[\d.]+)/;
const BRANCH_RE = /\]\s*\|\s*([^|]+?)\s*\|\s*(?:Opus|Sonnet|Haiku)/i;
const PERMISSION_RE = /(bypass permissions?\s+(?:on|off))/i;

export function terminalStatusLineParse(lines: string[]): TerminalStatusLineData | null {
	const joined = lines.join("\n");

	const sessionId = SESSION_ID_RE.exec(joined)?.[1] ?? null;
	const resumeId = RESUME_ID_RE.exec(joined)?.[1] ?? null;

	if (!(sessionId || resumeId)) return null;

	return {
		branch: BRANCH_RE.exec(joined)?.[1] ?? null,
		cost: COST_RE.exec(joined)?.[1] ?? null,
		model: MODEL_RE.exec(joined)?.[1] ?? null,
		permissionMode: PERMISSION_RE.exec(joined)?.[1] ?? null,
		resumeId,
		sessionId,
		tokenUsage: TOKEN_RE.exec(joined)?.[1] ?? null,
	};
}

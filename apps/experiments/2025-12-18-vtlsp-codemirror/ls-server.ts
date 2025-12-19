import { LSWSServer } from "@valtown/ls-ws-server";

const TSSERVER_PATH = process.env.TSSERVER_PATH || "/home/claude/.bun/bin/typescript-language-server";

export function createLSServer() {
	return new LSWSServer({
		lsArgs: [
			"--stdio",
		],
		lsCommand: TSSERVER_PATH,
		maxProcs: 1,
		maxSessionConns: 5,
		onProcError: (sessionId, error) => {
			console.error(`[LSP] Process error for session ${sessionId}:`, error);
		},
		onProcExit: (sessionId, code) => {
			console.log(`[LSP] Process exited for session ${sessionId} with code ${code}`);
		},
		shutdownAfter: 900,
	});
}

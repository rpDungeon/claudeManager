import type { ServerWebSocket } from "bun";
import index from "./index.html";
import { createLSServer } from "./ls-server";

const lsServer = createLSServer();

type WSData = {
	sessionId: string;
	standardWs: WebSocketAdapter;
};

class WebSocketAdapter extends EventTarget implements WebSocket {
	readonly CONNECTING = 0;
	readonly OPEN = 1;
	readonly CLOSING = 2;
	readonly CLOSED = 3;

	binaryType: BinaryType = "blob";
	bufferedAmount = 0;
	extensions = "";
	protocol = "";
	url: string;

	private _readyState: number = this.CONNECTING;
	private serverWs: ServerWebSocket<WSData> | null = null;

	onopen: ((this: WebSocket, ev: Event) => void) | null = null;
	onclose: ((this: WebSocket, ev: CloseEvent) => void) | null = null;
	onerror: ((this: WebSocket, ev: Event) => void) | null = null;
	onmessage: ((this: WebSocket, ev: MessageEvent) => void) | null = null;

	constructor(url: string) {
		super();
		this.url = url;
	}

	get readyState(): number {
		return this._readyState;
	}

	attachServerWebSocket(ws: ServerWebSocket<WSData>) {
		this.serverWs = ws;
		this._readyState = this.OPEN;
		const openEvent = new Event("open");
		this.onopen?.(openEvent);
		this.dispatchEvent(openEvent);
	}

	send(data: string | ArrayBufferLike | Blob | ArrayBufferView): void {
		if (this.serverWs && this._readyState === this.OPEN) {
			this.serverWs.send(data as string);
		}
	}

	close(code?: number, reason?: string): void {
		if (this.serverWs && this._readyState === this.OPEN) {
			this._readyState = this.CLOSING;
			this.serverWs.close(code, reason);
		}
	}

	handleMessage(data: string | Buffer) {
		const messageEvent = new MessageEvent("message", {
			data: typeof data === "string" ? data : data.toString(),
		});
		this.onmessage?.(messageEvent);
		this.dispatchEvent(messageEvent);
	}

	handleClose(code: number, reason: string) {
		this._readyState = this.CLOSED;
		const closeEvent = new CloseEvent("close", {
			code,
			reason,
		});
		this.onclose?.(closeEvent);
		this.dispatchEvent(closeEvent);
	}

	handleError(error: Error) {
		const errorEvent = new ErrorEvent("error", {
			error,
		});
		this.onerror?.(errorEvent);
		this.dispatchEvent(errorEvent);
	}
}

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3002;

const server = Bun.serve<WSData>({
	fetch(req, server) {
		const url = new URL(req.url);

		if (url.pathname === "/ws") {
			const sessionId = url.searchParams.get("sessionId") || "default";
			const standardWs = new WebSocketAdapter(`ws://localhost:3000/ws?sessionId=${sessionId}`);

			const upgraded = server.upgrade(req, {
				data: {
					sessionId,
					standardWs,
				},
			});

			if (upgraded) {
				return undefined;
			}
			return new Response("WebSocket upgrade failed", {
				status: 400,
			});
		}

		return new Response("Not Found", {
			status: 404,
		});
	},
	port: PORT,
	routes: {
		"/": index,
	},
	websocket: {
		close(ws, code, reason) {
			console.log(`[WS] Connection closed for session: ${ws.data.sessionId}`);
			ws.data.standardWs.handleClose(code, reason);
		},
		error(ws, error) {
			console.error(`[WS] Error for session: ${ws.data.sessionId}`, error);
			ws.data.standardWs.handleError(error);
		},
		message(ws, message) {
			ws.data.standardWs.handleMessage(message);
		},
		open(ws) {
			const { sessionId, standardWs } = ws.data;
			console.log(`[WS] New connection for session: ${sessionId}`);

			standardWs.attachServerWebSocket(ws);
			lsServer.handleNewWebsocket(standardWs, sessionId);
		},
	},
});

console.log(`Server running at http://localhost:${PORT}`);
console.log(`WebSocket endpoint: ws://localhost:${PORT}/ws?sessionId=<id>`);

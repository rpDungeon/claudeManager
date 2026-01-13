import { spawn } from "node:child_process";

export interface SearchMatch {
	line: number;
	column: number;
	text: string;
	matchStart: number;
	matchEnd: number;
}

export interface SearchResult {
	filePath: string;
	relativePath: string;
	matches: SearchMatch[];
}

export interface SearchOptions {
	caseSensitive?: boolean;
	wholeWord?: boolean;
	regex?: boolean;
	maxResults?: number;
}

function searchWithGrep(
	rootPath: string,
	query: string,
	options: SearchOptions,
): Promise<SearchResult[]> {
	return new Promise((resolve, reject) => {
		const args = [
			"-r",
			"-n",
			"--include=*.*",
			"-I",
		];

		if (!options.caseSensitive) {
			args.push("-i");
		}

		if (options.wholeWord) {
			args.push("-w");
		}

		if (!options.regex) {
			args.push("-F");
		}

		args.push("--", query, rootPath);

		const grep = spawn("grep", args);
		let stdout = "";
		let stderr = "";

		grep.stdout.on("data", (data) => {
			stdout += data.toString();
		});

		grep.stderr.on("data", (data) => {
			stderr += data.toString();
		});

		grep.on("close", (code) => {
			if (code !== 0 && code !== 1 && stderr) {
				console.error("[SearchService] grep error:", stderr);
			}

			const results = new Map<string, SearchResult>();
			const lines = stdout.split("\n").filter(Boolean);

			for (const line of lines) {
				const match = line.match(/^(.+?):(\d+):(.*)$/);
				if (!match) continue;

				const [, filePath, lineNum, text] = match;
				const relativePath = filePath.startsWith(rootPath)
					? filePath.slice(rootPath.length + 1)
					: filePath;

				if (filePath.includes("node_modules") || filePath.includes(".git")) {
					continue;
				}

				if (!results.has(filePath)) {
					results.set(filePath, {
						filePath,
						matches: [],
						relativePath,
					});
				}

				const result = results.get(filePath)!;
				const searchQuery = options.caseSensitive ? query : query.toLowerCase();
				const searchText = options.caseSensitive ? text : text.toLowerCase();
				const matchStart = searchText.indexOf(searchQuery);
				const matchEnd = matchStart >= 0 ? matchStart + query.length : 0;

				result.matches.push({
					column: matchStart + 1,
					line: Number.parseInt(lineNum, 10),
					matchEnd,
					matchStart: Math.max(0, matchStart),
					text: text.trim(),
				});
			}

			resolve(Array.from(results.values()).slice(0, 50));
		});

		grep.on("error", (err) => {
			reject(err);
		});
	});
}

export const searchService = {
	async search(
		rootPath: string,
		query: string,
		options: SearchOptions = {},
	): Promise<SearchResult[]> {
		if (!query.trim()) {
			return [];
		}

		return searchWithGrep(rootPath, query, options);
	},
};

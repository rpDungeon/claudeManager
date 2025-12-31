import type { GitFileEntry } from "@claude-manager/common/src/git/git.types";
import { GitFileStatusCode } from "@claude-manager/common/src/git/git.types";

export enum GitFileArea {
	Staged = "staged",
	Unstaged = "unstaged",
	Untracked = "untracked",
}

export function gitFileEntryAreaGet(entry: GitFileEntry): GitFileArea {
	const indexStatus = entry.statusIndex;
	const workingStatus = entry.statusWorking;

	if (
		indexStatus === GitFileStatusCode.Added ||
		indexStatus === GitFileStatusCode.Modified ||
		indexStatus === GitFileStatusCode.Deleted ||
		indexStatus === GitFileStatusCode.Renamed ||
		indexStatus === GitFileStatusCode.Copied
	) {
		return GitFileArea.Staged;
	}

	if (workingStatus === GitFileStatusCode.Untracked) {
		return GitFileArea.Untracked;
	}

	return GitFileArea.Unstaged;
}

export function gitFilesGroupByArea(files: GitFileEntry[]): Record<GitFileArea, GitFileEntry[]> {
	const grouped: Record<GitFileArea, GitFileEntry[]> = {
		[GitFileArea.Staged]: [],
		[GitFileArea.Unstaged]: [],
		[GitFileArea.Untracked]: [],
	};

	for (const file of files) {
		const area = gitFileEntryAreaGet(file);
		grouped[area].push(file);
	}

	return grouped;
}

export const GIT_AREA_LABELS: Record<GitFileArea, string> = {
	[GitFileArea.Staged]: "Staged Changes",
	[GitFileArea.Unstaged]: "Changes",
	[GitFileArea.Untracked]: "Untracked Files",
};

export function gitStatusCodeLabel(code: GitFileStatusCode): string {
	switch (code) {
		case GitFileStatusCode.Added:
			return "A";
		case GitFileStatusCode.Modified:
			return "M";
		case GitFileStatusCode.Deleted:
			return "D";
		case GitFileStatusCode.Renamed:
			return "R";
		case GitFileStatusCode.Copied:
			return "C";
		case GitFileStatusCode.Untracked:
			return "U";
		case GitFileStatusCode.Ignored:
			return "I";
		case GitFileStatusCode.UpdatedButUnmerged:
			return "!";
		default:
			return "";
	}
}

export function gitStatusCodeColor(code: GitFileStatusCode): string {
	switch (code) {
		case GitFileStatusCode.Added:
			return "text-terminal-green";
		case GitFileStatusCode.Modified:
			return "text-terminal-amber";
		case GitFileStatusCode.Deleted:
			return "text-terminal-red";
		case GitFileStatusCode.Renamed:
			return "text-terminal-cyan";
		case GitFileStatusCode.Copied:
			return "text-terminal-cyan";
		case GitFileStatusCode.Untracked:
			return "text-text-tertiary";
		case GitFileStatusCode.UpdatedButUnmerged:
			return "text-terminal-red";
		default:
			return "text-text-tertiary";
	}
}

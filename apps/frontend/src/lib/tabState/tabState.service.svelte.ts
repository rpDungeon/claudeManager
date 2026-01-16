import type { LayoutId } from "@claude-manager/common/src/layout/layout.id";
import type { ProjectId } from "@claude-manager/common/src/project/project.id";

const SESSION_KEY = "claude-manager-tab-state";
const LOCAL_KEY = "claude-manager-default-state";

interface TabState {
	projectId: ProjectId | null;
	layoutId: LayoutId | null;
	sidebarWidth: number;
	sidebarCollapsed: boolean;
}

const DEFAULT_SIDEBAR_WIDTH = 256;

const DEFAULT_STATE: TabState = {
	layoutId: null,
	projectId: null,
	sidebarCollapsed: false,
	sidebarWidth: DEFAULT_SIDEBAR_WIDTH,
};

export { DEFAULT_SIDEBAR_WIDTH };

function tabStateLoadFromSession(): TabState | null {
	if (typeof sessionStorage === "undefined") return null;

	const stored = sessionStorage.getItem(SESSION_KEY);
	if (!stored) return null;

	try {
		return JSON.parse(stored) as TabState;
	} catch {
		return null;
	}
}

function tabStateLoadFromLocal(): TabState {
	if (typeof localStorage === "undefined")
		return {
			...DEFAULT_STATE,
		};

	const stored = localStorage.getItem(LOCAL_KEY);
	if (!stored)
		return {
			...DEFAULT_STATE,
		};

	try {
		const parsed = JSON.parse(stored) as Partial<TabState>;
		return {
			...DEFAULT_STATE,
			...parsed,
		};
	} catch {
		return {
			...DEFAULT_STATE,
		};
	}
}

function tabStateSaveToSession(state: TabState): void {
	if (typeof sessionStorage === "undefined") return;
	sessionStorage.setItem(SESSION_KEY, JSON.stringify(state));
}

function tabStateSaveToLocal(state: TabState): void {
	if (typeof localStorage === "undefined") return;
	localStorage.setItem(LOCAL_KEY, JSON.stringify(state));
}

export function tabStateLoad(): TabState {
	const sessionState = tabStateLoadFromSession();
	if (sessionState) return sessionState;

	return tabStateLoadFromLocal();
}

export function tabStateSave(state: TabState): void {
	tabStateSaveToSession(state);
	tabStateSaveToLocal(state);
}

export function tabStateProjectIdSave(projectId: ProjectId | null): void {
	const current = tabStateLoad();
	tabStateSave({
		...current,
		projectId,
	});
}

export function tabStateLayoutIdSave(layoutId: LayoutId | null): void {
	const current = tabStateLoad();
	tabStateSave({
		...current,
		layoutId,
	});
}

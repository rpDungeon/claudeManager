const STORAGE_KEY = "claude-manager-settings";

const DEFAULT_SETTINGS = {
	editorFontSize: 12,
	terminalFontSize: 12,
};

type Settings = typeof DEFAULT_SETTINGS;

function settingsLoad(): Settings {
	if (typeof localStorage === "undefined")
		return {
			...DEFAULT_SETTINGS,
		};

	const stored = localStorage.getItem(STORAGE_KEY);
	if (!stored)
		return {
			...DEFAULT_SETTINGS,
		};

	try {
		const parsed = JSON.parse(stored) as Partial<Settings>;
		return {
			...DEFAULT_SETTINGS,
			...parsed,
		};
	} catch {
		return {
			...DEFAULT_SETTINGS,
		};
	}
}

function settingsSave(settings: Settings): void {
	if (typeof localStorage === "undefined") return;
	localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

const state = $state(settingsLoad());

export const settings = {
	get terminalFontSize() {
		return state.terminalFontSize;
	},
	set terminalFontSize(value: number) {
		state.terminalFontSize = value;
		settingsSave(state);
	},
};

export function settingsTerminalFontSizeGet(): number {
	return state.terminalFontSize;
}

export function settingsTerminalFontSizeSet(value: number): void {
	state.terminalFontSize = value;
	settingsSave(state);
}

export function settingsEditorFontSizeGet(): number {
	return state.editorFontSize;
}

export function settingsEditorFontSizeSet(value: number): void {
	state.editorFontSize = value;
	settingsSave(state);
}

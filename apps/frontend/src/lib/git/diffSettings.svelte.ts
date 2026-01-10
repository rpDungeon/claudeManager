export enum DiffViewMode {
	Inline = "inline",
	Split = "split",
}

let mode = $state<DiffViewMode>(DiffViewMode.Inline);

export const diffSettings = {
	get mode() {
		return mode;
	},
	set mode(value: DiffViewMode) {
		mode = value;
	},
	toggle() {
		mode = mode === DiffViewMode.Inline ? DiffViewMode.Split : DiffViewMode.Inline;
	},
};

import { type Command, commandRegistry } from "./command.lib";

type CommandContext = {
	formatDocument?: () => void;
	renameSymbol?: () => void;
	goToDefinition?: () => void;
	findReferences?: () => void;
	goToLine?: () => void;
	saveFile?: () => void;
	saveAllFiles?: () => void;
	toggleSidebar?: () => void;
	toggleTerminal?: () => void;
	find?: () => void;
	findInFiles?: () => void;
	replace?: () => void;
	newTerminal?: () => void;
	openSettings?: () => void;
};

function commandsDefaultRegister(context: CommandContext): () => void {
	const commands: Command[] = [
		{
			category: "editor",
			execute: () => context.formatDocument?.(),
			id: "editor.formatDocument",
			keybinding: "Shift+Alt+F",
			title: "Format Document",
		},
		{
			category: "editor",
			execute: () => context.renameSymbol?.(),
			id: "editor.renameSymbol",
			keybinding: "F2",
			title: "Rename Symbol",
		},
		{
			category: "editor",
			execute: () => context.goToDefinition?.(),
			id: "editor.goToDefinition",
			keybinding: "F12",
			title: "Go to Definition",
		},
		{
			category: "editor",
			execute: () => context.findReferences?.(),
			id: "editor.findReferences",
			keybinding: "Shift+F12",
			title: "Find All References",
		},
		{
			category: "editor",
			execute: () => context.goToLine?.(),
			id: "editor.goToLine",
			keybinding: "Ctrl+G",
			title: "Go to Line...",
		},
		{
			category: "file",
			execute: () => context.saveFile?.(),
			id: "file.save",
			keybinding: "Ctrl+S",
			title: "Save",
		},
		{
			category: "file",
			execute: () => context.saveAllFiles?.(),
			id: "file.saveAll",
			keybinding: "Ctrl+Shift+S",
			title: "Save All",
		},
		{
			category: "view",
			execute: () => context.toggleSidebar?.(),
			id: "view.toggleSidebar",
			keybinding: "Ctrl+B",
			title: "Toggle Sidebar",
		},
		{
			category: "view",
			execute: () => context.toggleTerminal?.(),
			id: "view.toggleTerminal",
			keybinding: "Ctrl+`",
			title: "Toggle Terminal",
		},
		{
			category: "search",
			execute: () => context.find?.(),
			id: "search.find",
			keybinding: "Ctrl+F",
			title: "Find",
		},
		{
			category: "search",
			execute: () => context.findInFiles?.(),
			id: "search.findInFiles",
			keybinding: "Ctrl+Shift+F",
			title: "Find in Files",
		},
		{
			category: "search",
			execute: () => context.replace?.(),
			id: "search.replace",
			keybinding: "Ctrl+H",
			title: "Replace",
		},
		{
			category: "terminal",
			execute: () => context.newTerminal?.(),
			id: "terminal.new",
			title: "New Terminal",
		},
		{
			category: "settings",
			execute: () => context.openSettings?.(),
			id: "settings.open",
			keybinding: "Ctrl+,",
			title: "Open Settings",
		},
	];

	return commandRegistry.registerMany(commands);
}

export type { CommandContext };
export { commandsDefaultRegister };

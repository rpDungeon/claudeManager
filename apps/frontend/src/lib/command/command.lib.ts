type CommandId = string;

type CommandCategory = "editor" | "file" | "view" | "git" | "terminal" | "search" | "debug" | "settings";

type Command = {
	id: CommandId;
	title: string;
	category: CommandCategory;
	keybinding?: string;
	when?: () => boolean;
	execute: () => void | Promise<void>;
};

const MAC_REGEX = /Mac/;

class CommandRegistry {
	private commands = new Map<CommandId, Command>();
	private listeners = new Set<() => void>();

	register(command: Command): () => void {
		this.commands.set(command.id, command);
		this.notifyListeners();

		return () => {
			this.commands.delete(command.id);
			this.notifyListeners();
		};
	}

	registerMany(commands: Command[]): () => void {
		for (const command of commands) {
			this.commands.set(command.id, command);
		}
		this.notifyListeners();

		return () => {
			for (const command of commands) {
				this.commands.delete(command.id);
			}
			this.notifyListeners();
		};
	}

	get(id: CommandId): Command | undefined {
		return this.commands.get(id);
	}

	getAll(): Command[] {
		return Array.from(this.commands.values());
	}

	getByCategory(category: CommandCategory): Command[] {
		return this.getAll().filter((cmd) => cmd.category === category);
	}

	search(query: string): Command[] {
		const lowerQuery = query.toLowerCase();
		return this.getAll()
			.filter((cmd) => {
				if (cmd.when && !cmd.when()) return false;
				return (
					cmd.title.toLowerCase().includes(lowerQuery) ||
					cmd.id.toLowerCase().includes(lowerQuery) ||
					cmd.category.toLowerCase().includes(lowerQuery)
				);
			})
			.sort((a, b) => {
				const aTitle = a.title.toLowerCase();
				const bTitle = b.title.toLowerCase();
				const aStartsWith = aTitle.startsWith(lowerQuery);
				const bStartsWith = bTitle.startsWith(lowerQuery);
				if (aStartsWith && !bStartsWith) return -1;
				if (!aStartsWith && bStartsWith) return 1;
				return aTitle.localeCompare(bTitle);
			});
	}

	execute(id: CommandId): void {
		const command = this.commands.get(id);
		if (command) {
			void command.execute();
		}
	}

	subscribe(listener: () => void): () => void {
		this.listeners.add(listener);
		return () => this.listeners.delete(listener);
	}

	private notifyListeners(): void {
		for (const listener of this.listeners) {
			listener();
		}
	}
}

function commandKeybindingFormat(keybinding: string): string {
	const isMac = typeof navigator !== "undefined" && MAC_REGEX.test(navigator.platform);

	return keybinding
		.replace(/Mod/g, isMac ? "⌘" : "Ctrl")
		.replace(/Ctrl/g, isMac ? "⌃" : "Ctrl")
		.replace(/Alt/g, isMac ? "⌥" : "Alt")
		.replace(/Shift/g, isMac ? "⇧" : "Shift")
		.replace(/\+/g, isMac ? "" : "+");
}

export type { Command, CommandCategory, CommandId };
export { commandKeybindingFormat };
export const commandRegistry = new CommandRegistry();

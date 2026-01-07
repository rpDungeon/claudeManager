declare module "rainbowbrackets" {
	import type { Extension } from "@codemirror/state";
	export default function rainbowBrackets(): Extension;
}

declare module "@rigstech/codemirror-vscodesearch" {
	import type { Extension } from "@codemirror/state";
	export const vscodeSearch: Extension[];
}

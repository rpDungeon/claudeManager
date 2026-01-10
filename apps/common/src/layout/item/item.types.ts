import { z } from "zod";

import { layoutItemDiffSchema } from "./item.diff";
import { layoutItemEditorSchema } from "./item.editor";
import { layoutItemIframeSchema } from "./item.iframe";
import { layoutItemImageSchema } from "./item.image";
import { layoutItemMarkdownSchema } from "./item.markdown";
import { layoutItemTerminalSchema } from "./item.terminal";

export const layoutItemSchema = z.discriminatedUnion("type", [
	layoutItemTerminalSchema,
	layoutItemIframeSchema,
	layoutItemImageSchema,
	layoutItemMarkdownSchema,
	layoutItemEditorSchema,
	layoutItemDiffSchema,
]);

export type LayoutItem = z.infer<typeof layoutItemSchema>;

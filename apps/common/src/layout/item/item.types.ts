import { z } from "zod";

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
]);

export type LayoutItem = z.infer<typeof layoutItemSchema>;

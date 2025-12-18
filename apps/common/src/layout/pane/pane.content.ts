import { z } from "zod";

import { layoutPaneContentIframeSchema } from "./content/content.iframe";
import { layoutPaneContentImageSchema } from "./content/content.image";
import { layoutPaneContentMarkdownSchema } from "./content/content.markdown";
import { layoutPaneContentTerminalSchema } from "./content/content.terminal";

export const layoutPaneContentSchema = z.discriminatedUnion("type", [
	layoutPaneContentTerminalSchema,
	layoutPaneContentIframeSchema,
	layoutPaneContentImageSchema,
	layoutPaneContentMarkdownSchema,
]);

export type LayoutPaneContent = z.infer<typeof layoutPaneContentSchema>;

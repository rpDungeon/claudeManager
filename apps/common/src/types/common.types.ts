import { z } from "zod";

import type { Brand } from "./util.types";

export type UnixTimestamp = Brand<number, "UnixTimestamp">;

export const percentageSchema = z
	.number()
	.min(0, "Percentage must be >= 0")
	.max(100, "Percentage must be <= 100")
	.brand("Percentage");

export type Percentage = z.infer<typeof percentageSchema>;

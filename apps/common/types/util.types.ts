/**
 * Brand utility type for creating nominal types.
 * Prevents accidental mixing of string IDs (e.g., UserId vs ChatId).
 *
 * @example
 * type UserId = Brand<string, "UserId">;
 * type ChatId = Brand<string, "ChatId">;
 *
 * const userId: UserId = "123" as UserId;
 * const chatId: ChatId = "456" as ChatId;
 *
 * // This will cause a type error:
 * // const wrong: UserId = chatId;
 */
export type Brand<K, T> = K & {
	readonly __brand: T;
};

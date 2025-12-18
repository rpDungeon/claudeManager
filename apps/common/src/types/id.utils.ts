import { customAlphabet } from "nanoid";

const LOWERCASE_ALPHABET = "0123456789abcdefghijklmnopqrstuvwxyz";
const generateId = customAlphabet(LOWERCASE_ALPHABET, 21);

export const createPrefixedId = <T extends string>(prefix: T) => {
	return () => `${prefix}:${generateId()}`;
};

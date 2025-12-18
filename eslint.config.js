import svelte from "eslint-plugin-svelte";
import svelteParser from "svelte-eslint-parser";
import ts from "typescript-eslint";
import svelteComponentJsdoc from "./eslint-rules/svelte-component-jsdoc.js";

/**
 * ESLint config - ONLY for Svelte-specific rules that Biome can't handle.
 * Biome handles all JS/TS linting. This is strictly supplemental.
 */
export default [
	// Global ignores
	{
		ignores: [
			"**/node_modules/**",
			"**/.svelte-kit/**",
			"**/dist/**",
			"**/build/**",
		],
	},

	// Svelte-only config
	{
		files: [
			"**/*.svelte",
		],
		languageOptions: {
			parser: svelteParser,
			parserOptions: {
				parser: ts.parser,
				svelteFeatures: {
					runes: true,
				},
			},
		},
		plugins: {
			"@typescript-eslint": ts.plugin,
			custom: {
				rules: {
					"svelte-component-jsdoc": svelteComponentJsdoc,
				},
			},
			svelte,
		},
		rules: {
			// Unused variables - Biome can't detect template usage
			// Use @typescript-eslint version to properly understand TS type definitions
			"@typescript-eslint/no-unused-vars": [
				"error",
				{
					argsIgnorePattern: "^_",
					varsIgnorePattern: "^\\$\\$|^_",
				},
			],
			// Our custom rule for JSDoc validation
			"custom/svelte-component-jsdoc": [
				"error",
				{
					currentStyleguideVersion: "1.0.0",
				},
			],

			// Svelte-specific rules that Biome can't handle
			"svelte/no-unused-svelte-ignore": "error",
			"svelte/valid-compile": "error",
		},
	},

	// Exclude stories from component JSDoc requirement
	{
		files: [
			"**/*.stories.svelte",
		],
		rules: {
			"custom/svelte-component-jsdoc": "off",
		},
	},
];

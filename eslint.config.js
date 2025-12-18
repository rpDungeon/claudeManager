import svelte from "eslint-plugin-svelte";
import svelteParser from "svelte-eslint-parser";
import ts from "typescript-eslint";
import exportPrefixFromPath from "./eslint-rules/export-prefix-from-path.js";
import svelteComponentJsdoc from "./eslint-rules/svelte-component-jsdoc.js";

/**
 * ESLint config - Supplements Biome with rules it can't handle:
 * 1. Svelte-specific rules (unused vars in templates, valid-compile)
 * 2. Path-based export naming conventions
 */
export default [
	// Global ignores
	{
		ignores: [
			"**/node_modules/**",
			"**/.svelte-kit/**",
			"**/dist/**",
			"**/build/**",
			"**/experiments/**",
		],
	},

	// TypeScript files - export prefix enforcement
	// Uses package.json as anchor to determine project-relative paths
	{
		files: [
			"apps/common/**/*.ts",
			"apps/backend/src/**/*.ts",
		],
		languageOptions: {
			parser: ts.parser,
		},
		plugins: {
			custom: {
				rules: {
					"export-prefix-from-path": exportPrefixFromPath,
				},
			},
		},
		rules: {
			"custom/export-prefix-from-path": [
				"error",
				{
					// Only "src" is ignored by default, rest auto-detected from package.json
					ignorePatterns: [
						".config.",
						"src/types",
					],
				},
			],
		},
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

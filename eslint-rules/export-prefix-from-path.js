/**
 * ESLint rule: export-prefix-from-path
 *
 * Enforces that all exports from a file are prefixed based on the file's directory path,
 * relative to the nearest package.json.
 *
 * Example:
 * - File: apps/common/features/claude/session/claudeSession.types.ts
 * - package.json at: apps/common/package.json
 * - Relative path: features/claude/session/claudeSession.types.ts
 * - Last 2 dirs (ignoring "src"): claude, session
 * - Required prefix: claudeSession
 */

import { existsSync } from "node:fs";
import { dirname, join } from "node:path";

/** @type {import('eslint').Rule.RuleModule} */
export default {
	create(context) {
		const options = context.options[0] || {};
		const ignoreDirs = new Set(
			options.ignoreDirs || [
				"src",
			],
		);
		const ignoreFiles = options.ignoreFiles || [
			"index.ts",
			"index.js",
		];
		const ignorePatterns = options.ignorePatterns || [];

		const filename = context.filename || context.getFilename();

		// Skip ignored files
		const basename = filename.split("/").pop();
		if (ignoreFiles.includes(basename)) {
			return {};
		}

		// Skip files matching ignore patterns
		for (const pattern of ignorePatterns) {
			if (filename.includes(pattern)) {
				return {};
			}
		}

		// Find the nearest package.json by walking up the directory tree
		const findPackageJsonDir = (startPath) => {
			let currentDir = dirname(startPath);
			let previousDir = null;

			while (currentDir !== previousDir) {
				if (existsSync(join(currentDir, "package.json"))) {
					return currentDir;
				}
				previousDir = currentDir;
				currentDir = dirname(currentDir);
			}
			return null;
		};

		const packageJsonDir = findPackageJsonDir(filename);
		if (!packageJsonDir) {
			return {}; // No package.json found, skip
		}

		// Get relative path from package.json directory
		const relativePath = filename.slice(packageJsonDir.length + 1); // +1 for the slash
		const pathParts = relativePath.split("/");
		const dirParts = pathParts.slice(0, -1); // Remove filename

		// Filter out ignored directories (default: just "src")
		const relevantDirs = dirParts.filter((dir) => {
			if (ignoreDirs.has(dir)) return false;
			if (dir.startsWith(".")) return false;
			return true;
		});

		const prefixSegments = relevantDirs;

		if (prefixSegments.length === 0) {
			return {};
		}

		// Build camelCase prefix: ["claude", "session"] -> "claudeSession"
		const prefix = prefixSegments
			.map((seg, i) => {
				const cleaned = seg.replace(/[^a-zA-Z0-9]/g, "");
				if (i === 0) {
					return cleaned.toLowerCase();
				}
				return cleaned.charAt(0).toUpperCase() + cleaned.slice(1).toLowerCase();
			})
			.join("");

		// PascalCase version for types/interfaces/classes
		const pascalPrefix = prefix.charAt(0).toUpperCase() + prefix.slice(1);

		/**
		 * Check if a name has the required prefix
		 */
		function hasValidPrefix(name) {
			if (!name) return true;

			// camelCase exports: claudeSessionCreate, claudeSessionValidate
			if (name.startsWith(prefix)) return true;

			// PascalCase exports (types/interfaces/classes): ClaudeSessionData
			if (name.startsWith(pascalPrefix)) return true;

			return false;
		}

		/**
		 * Report invalid export name
		 */
		function reportInvalidExport(node, name, kind) {
			context.report({
				data: {
					expected:
						kind === "type" || kind === "interface" || kind === "class" || kind === "enum" ? pascalPrefix : prefix,
					kind,
					name,
				},
				messageId: "invalidPrefix",
				node,
			});
		}

		return {
			// export const foo = ...
			// export function foo() {}
			// export class Foo {}
			ExportNamedDeclaration(node) {
				// Skip re-exports: export { foo } from './other'
				if (node.source) return;

				const declaration = node.declaration;
				if (!declaration) {
					// export { foo, bar }
					for (const specifier of node.specifiers) {
						const name = specifier.exported.name;
						if (!hasValidPrefix(name)) {
							reportInvalidExport(specifier, name, "value");
						}
					}
					return;
				}

				// Variable declarations: export const foo = ...
				if (declaration.type === "VariableDeclaration") {
					for (const declarator of declaration.declarations) {
						if (declarator.id.type === "Identifier") {
							const name = declarator.id.name;
							if (!hasValidPrefix(name)) {
								reportInvalidExport(declarator, name, "variable");
							}
						}

						// Handle object destructuring: export const { a, b } = obj
						if (declarator.id.type === "ObjectPattern") {
							for (const property of declarator.id.properties) {
								if (property.type === "Property" && property.key.type === "Identifier") {
									const name = property.key.name;
									if (!hasValidPrefix(name)) {
										reportInvalidExport(property, name, "variable");
									}
								}
							}
						}

						// Handle array destructuring: export const [a, b] = arr
						if (declarator.id.type === "ArrayPattern") {
							for (const element of declarator.id.elements) {
								if (element?.type === "Identifier") {
									const name = element.name;
									if (!hasValidPrefix(name)) {
										reportInvalidExport(element, name, "variable");
									}
								}
							}
						}
					}
				}

				// Function declarations: export function foo() {}
				if (declaration.type === "FunctionDeclaration" && declaration.id) {
					const name = declaration.id.name;
					if (!hasValidPrefix(name)) {
						reportInvalidExport(declaration, name, "function");
					}
				}

				// Class declarations: export class Foo {}
				if (declaration.type === "ClassDeclaration" && declaration.id) {
					const name = declaration.id.name;
					if (!hasValidPrefix(name)) {
						reportInvalidExport(declaration, name, "class");
					}
				}

				// Type alias: export type Foo = ...
				if (declaration.type === "TSTypeAliasDeclaration" && declaration.id) {
					const name = declaration.id.name;
					if (!hasValidPrefix(name)) {
						reportInvalidExport(declaration, name, "type");
					}
				}

				// Interface: export interface Foo {}
				if (declaration.type === "TSInterfaceDeclaration" && declaration.id) {
					const name = declaration.id.name;
					if (!hasValidPrefix(name)) {
						reportInvalidExport(declaration, name, "interface");
					}
				}

				// Enum: export enum Foo {}
				if (declaration.type === "TSEnumDeclaration" && declaration.id) {
					const name = declaration.id.name;
					if (!hasValidPrefix(name)) {
						reportInvalidExport(declaration, name, "enum");
					}
				}
			},

			// export default is typically allowed without prefix
			// but can be enabled via option if needed
		};
	},
	meta: {
		docs: {
			category: "Naming Conventions",
			description: "Enforce that exports are prefixed based on file path relative to package.json",
		},
		messages: {
			invalidPrefix: 'Exported {{kind}} "{{name}}" must start with "{{expected}}"',
		},
		schema: [
			{
				additionalProperties: false,
				properties: {
					ignoreDirs: {
						default: [
							"src",
						],
						description: "Directory names to ignore when building prefix (default: ['src'])",
						items: {
							type: "string",
						},
						type: "array",
					},
					ignoreFiles: {
						default: [
							"index.ts",
							"index.js",
						],
						description: "Filenames to skip (default: ['index.ts', 'index.js'])",
						items: {
							type: "string",
						},
						type: "array",
					},
					ignorePatterns: {
						description: "Path patterns to skip entirely",
						items: {
							type: "string",
						},
						type: "array",
					},
				},
				type: "object",
			},
		],
		type: "problem",
	},
};

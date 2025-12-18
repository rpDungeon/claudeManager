/**
 * ESLint rule: svelte-component-jsdoc
 *
 * Validates that Svelte components have proper JSDoc with:
 * - @component tag
 * - name: ComponentName
 * - type: smart | stupid
 * - styleguide: X.X.X (matching current version)
 * - description: What the component does (one sentence)
 * - usage: When to use it (one sentence)
 */

/** @type {import('eslint').Rule.RuleModule} */
export default {
	create(context) {
		const options = context.options[0] || {};
		const currentVersion = options.currentStyleguideVersion || "1.0.0";

		return {
			Program(node) {
				const sourceCode = context.sourceCode || context.getSourceCode();
				const filename = context.filename || context.getFilename();
				const isComponentFile = filename.endsWith(".component.svelte");

				// Only enforce on .component.svelte files
				if (!isComponentFile) {
					return;
				}

				// Get the full source text to find HTML comments
				// svelte-eslint-parser's getAllComments() only returns JS comments,
				// not HTML comments like <!-- @component -->
				const text = sourceCode.getText();

				// Find HTML comment containing @component
				// Match: <!-- ... @component ... -->
				const htmlCommentMatch = text.match(/<!--([\s\S]*?@component[\s\S]*?)-->/);
				const commentText = htmlCommentMatch ? htmlCommentMatch[1] : null;

				if (!commentText) {
					context.report({
						messageId: "missingJsdoc",
						node,
					});
					return;
				}

				// Check for name: ComponentName
				const nameMatch = commentText.match(/name:\s*(\S+)/i);
				if (!nameMatch) {
					context.report({
						messageId: "missingName",
						node,
					});
				}

				// Check for type: smart|stupid
				const typeMatch = commentText.match(/type:\s*(smart|stupid|\S+)/i);
				if (!typeMatch) {
					context.report({
						messageId: "missingType",
						node,
					});
				} else {
					const typeValue = typeMatch[1].toLowerCase();
					if (typeValue !== "smart" && typeValue !== "stupid") {
						context.report({
							data: {
								type: typeMatch[1],
							},
							messageId: "invalidType",
							node,
						});
					}
				}

				// Check for styleguide: X.X.X
				const styleguideMatch = commentText.match(/styleguide:\s*(\d+\.\d+\.\d+)/i);
				if (!styleguideMatch) {
					context.report({
						messageId: "missingStyleguide",
						node,
					});
				} else {
					const foundVersion = styleguideMatch[1];
					if (foundVersion !== currentVersion) {
						context.report({
							data: {
								expected: currentVersion,
								found: foundVersion,
							},
							messageId: "outdatedStyleguide",
							node,
						});
					}
				}

				// Check for description: (one sentence describing what it does)
				const descriptionMatch = commentText.match(/description:\s*(.+)/i);
				if (!descriptionMatch) {
					context.report({
						messageId: "missingDescription",
						node,
					});
				}

				// Check for usage: (one sentence describing when to use it)
				const usageMatch = commentText.match(/usage:\s*(.+)/i);
				if (!usageMatch) {
					context.report({
						messageId: "missingUsage",
						node,
					});
				}
			},
		};
	},
	meta: {
		docs: {
			category: "Styleguide",
			description: "Enforce JSDoc component classification in Svelte files",
		},
		messages: {
			invalidType: 'type must be either "smart" or "stupid", got "{{type}}"',
			missingComponent: "JSDoc must include @component tag",
			missingDescription: "JSDoc must include description: (what the component does)",
			missingJsdoc: "Component is missing JSDoc block with @component, name, type, styleguide, description, and usage",
			missingName: "JSDoc must include name: (component name, e.g., Button, Toggle)",
			missingStyleguide: "JSDoc must include styleguide version (e.g., styleguide: 1.0.0)",
			missingType: 'JSDoc must include "type: smart" or "type: stupid"',
			missingUsage: "JSDoc must include usage: (when to use the component)",
			outdatedStyleguide: "styleguide version {{found}} is outdated, current is {{expected}}",
		},
		schema: [
			{
				additionalProperties: false,
				properties: {
					currentStyleguideVersion: {
						description: "The current styleguide version to enforce",
						type: "string",
					},
				},
				type: "object",
			},
		],
		type: "problem",
	},
};

/**
 * ESLint rule: no-string-only-union
 *
 * Detects type aliases that are purely string literal unions and suggests
 * converting them to enums.
 *
 * Errors:
 *   type Theme = "dark" | "light"  // String-only union, use enum instead
 *
 * Allowed:
 *   type Theme = DarkTheme | LightTheme            // Type references only
 *   type Theme = DarkTheme | "yellow"              // Mixed (type ref + string)
 *   type Theme = BaseTheme | CustomTheme | "red"   // Mixed
 */

/** @type {import('eslint').Rule.RuleModule} */
export default {
	create(context) {
		return {
			TSTypeAliasDeclaration(node) {
				const typeAnnotation = node.typeAnnotation;

				if (typeAnnotation.type !== "TSUnionType") {
					return;
				}

				const unionTypes = typeAnnotation.types;

				if (unionTypes.length < 2) {
					return;
				}

				const stringLiterals = [];
				let hasNonStringLiteral = false;

				for (const type of unionTypes) {
					if (
						type.type === "TSLiteralType" &&
						type.literal.type === "Literal" &&
						typeof type.literal.value === "string"
					) {
						stringLiterals.push(type.literal.value);
					} else {
						hasNonStringLiteral = true;
					}
				}

				if (hasNonStringLiteral) {
					return;
				}

				if (stringLiterals.length < 2) {
					return;
				}

				const typeName = node.id.name;
				const enumMembers = stringLiterals.map((value) => {
					const memberName = stringToPascalCase(value);
					return `\t${memberName} = "${value}",`;
				});

				const suggestedEnum = `export enum ${typeName} {\n${enumMembers.join("\n")}\n}`;

				context.report({
					data: {
						name: typeName,
						suggestion: suggestedEnum,
					},
					messageId: "useEnum",
					node,
				});
			},
		};
	},
	meta: {
		docs: {
			category: "Best Practices",
			description: "Disallow string-only union types that should be enums",
		},
		messages: {
			useEnum: 'Type "{{name}}" is a string-only union. Convert to enum:\n\n{{suggestion}}',
		},
		schema: [],
		type: "suggestion",
	},
};

function stringToPascalCase(str) {
	return str
		.split(/[-_\s]+/)
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
		.join("");
}

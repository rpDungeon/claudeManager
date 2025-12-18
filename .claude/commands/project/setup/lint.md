---
description: Set up linting (Biome + ESLint), typecheck, and git hooks for a Bun monorepo
allowed-tools: Bash, Write, Read, Edit, Glob
---

Set up comprehensive linting for this Bun monorepo project.

**Argument:** `$ARGUMENTS` (expected: `yes` or `no` for Svelte support)

## Steps

### 1. Parse Arguments

- If argument is `yes` → include Svelte linting (eslint-plugin-svelte, svelte-check, svelte-eslint-parser)
- If argument is `no` → skip Svelte-specific linting
- If no argument provided → ask the user

### 2. Install Dependencies

Run `bun add -d` with these packages:

**Always install:**
- `@biomejs/biome` - Fast linter/formatter
- `typescript` - TypeScript compiler
- `husky` - Git hooks
- `lint-staged` - Run linters on staged files

**If Svelte = yes, also install:**
- `@eslint/js`
- `eslint`
- `eslint-plugin-svelte`
- `svelte-eslint-parser`
- `typescript-eslint`
- `globals`
- `svelte-check`

### 3. Create `biome.json`

Create this file at the project root:

```json
{
	"$schema": "https://biomejs.dev/schemas/2.3.10/schema.json",
	"assist": {
		"actions": {
			"source": {
				"organizeImports": "on",
				"useSortedAttributes": "on",
				"useSortedKeys": "on"
			}
		},
		"enabled": true
	},
	"css": {
		"parser": {
			"cssModules": true,
			"tailwindDirectives": true
		}
	},
	"files": {
		"ignoreUnknown": false,
		"includes": [
			"**",
			"!bun.lock",
			"!**/dist",
			"!**/.svelte-kit",
			"!**/.storybook",
			"!**/storybook-static"
		]
	},
	"formatter": {
		"attributePosition": "auto",
		"bracketSameLine": true,
		"bracketSpacing": true,
		"enabled": true,
		"expand": "always",
		"formatWithErrors": true,
		"indentStyle": "tab",
		"indentWidth": 2,
		"lineEnding": "lf",
		"lineWidth": 120,
		"useEditorconfig": false
	},
	"javascript": {
		"formatter": {
			"arrowParentheses": "always",
			"quoteProperties": "asNeeded",
			"quoteStyle": "double",
			"semicolons": "always",
			"trailingCommas": "all"
		},
		"parser": {
			"jsxEverywhere": false,
			"unsafeParameterDecoratorsEnabled": true
		}
	},
	"json": {
		"formatter": {
			"trailingCommas": "none"
		},
		"parser": {
			"allowComments": true,
			"allowTrailingCommas": true
		}
	},
	"linter": {
		"enabled": true,
		"includes": [
			"**",
			"!**/examples/**",
			"!**/*.example.ts",
			"!**/*.config.ts",
			"!**/*.config.js",
			"!**/svelte.config.js",
			"!**/vite.config.ts",
			"!**/drizzle.config.ts"
		],
		"rules": {
			"a11y": {
				"noNoninteractiveElementInteractions": "error"
			},
			"complexity": {
				"noBannedTypes": "off",
				"noForEach": "error",
				"noImplicitCoercions": "error",
				"useSimplifiedLogicExpression": "error",
				"useWhile": "error"
			},
			"correctness": {
				"noGlobalDirnameFilename": "error",
				"noProcessGlobal": "error",
				"noUnusedFunctionParameters": "error",
				"noUnusedImports": "error",
				"noUnusedVariables": "error",
				"useJsonImportAttributes": "error",
				"useSingleJsDocAsterisk": "error"
			},
			"nursery": {
				"noFloatingPromises": "info",
				"noImportCycles": "off",
				"noShadow": "warn",
				"noUselessUndefined": "off",
				"useExhaustiveSwitchCases": "warn",
				"useExplicitType": "off"
			},
			"performance": {
				"noAccumulatingSpread": "error",
				"noBarrelFile": "off",
				"noDelete": "warn",
				"noDynamicNamespaceImportAccess": "error",
				"noReExportAll": "off",
				"useTopLevelRegex": "error"
			},
			"recommended": true,
			"security": {
				"noBlankTarget": "error",
				"noDangerouslySetInnerHtml": "warn",
				"noDangerouslySetInnerHtmlWithChildren": "warn",
				"noGlobalEval": "error",
				"noSecrets": "off"
			},
			"style": {
				"noCommonJs": "error",
				"noDefaultExport": "info",
				"noEnum": "off",
				"noInferrableTypes": "off",
				"noParameterProperties": "warn",
				"noShoutyConstants": "error",
				"noSubstr": "error",
				"noUselessElse": "error",
				"noYodaExpression": "error",
				"useConsistentObjectDefinitions": "error",
				"useExportsLast": "info",
				"useGroupedAccessorPairs": "error",
				"useNumericSeparators": "info",
				"useObjectSpread": "error",
				"useSymbolDescription": "error",
				"useUnifiedTypeSignatures": "error"
			},
			"suspicious": {
				"noConstantBinaryExpressions": "error",
				"noThenProperty": "off",
				"noTsIgnore": "error",
				"noUnassignedVariables": "warn",
				"noUselessEscapeInString": "error",
				"useIterableCallbackReturn": "error",
				"useStaticResponseMethods": "error"
			}
		}
	},
	"overrides": [
		{
			"includes": ["**/utils.ts"],
			"linter": {
				"rules": {
					"suspicious": {
						"noExplicitAny": "off"
					}
				}
			}
		},
		{
			"includes": ["eslint-rules/**", "eslint.config.js"],
			"linter": {
				"rules": {
					"performance": {
						"useTopLevelRegex": "off"
					},
					"security": {
						"noSecrets": "off"
					},
					"style": {
						"noDefaultExport": "off"
					}
				}
			}
		},
		{
			"assist": {
				"actions": {
					"source": {
						"organizeImports": "off"
					}
				}
			},
			"includes": ["**/*.svelte"],
			"linter": {
				"rules": {
					"correctness": {
						"noUnusedImports": "off",
						"noUnusedVariables": "off"
					},
					"style": {
						"useConst": "off",
						"useImportType": "off"
					}
				}
			}
		},
		{
			"includes": ["**/*.stories.svelte"],
			"linter": {
				"rules": {
					"correctness": {
						"noUnusedVariables": "off"
					},
					"security": {
						"noSecrets": "off"
					},
					"style": {
						"noDefaultExport": "off",
						"useExportsLast": "off"
					}
				}
			}
		}
	],
	"vcs": {
		"clientKind": "git",
		"enabled": true,
		"useIgnoreFile": false
	}
}
```

### 4. Create `eslint.config.js` (only if Svelte = yes)

Auto-detect the frontend workspace by looking for `svelte.config.js` in `apps/*/` directories.

```javascript
import svelte from "eslint-plugin-svelte";
import svelteParser from "svelte-eslint-parser";
import ts from "typescript-eslint";

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
		files: ["**/*.svelte"],
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
			svelte,
		},
		rules: {
			// Unused variables - Biome can't detect template usage
			"@typescript-eslint/no-unused-vars": [
				"error",
				{
					argsIgnorePattern: "^_",
					varsIgnorePattern: "^\\$\\$|^_",
				},
			],

			// Svelte-specific rules that Biome can't handle
			"svelte/no-unused-svelte-ignore": "error",
			"svelte/valid-compile": "error",
		},
	},
];
```

### 5. Update `package.json`

Add/merge these scripts and config:

**If Svelte = yes:**
```json
{
  "scripts": {
    "lint": "bunx @biomejs/biome check . && bun run lint:svelte && bun run lint:svelte-check",
    "lint:biome": "bunx @biomejs/biome check .",
    "lint:fix": "bunx @biomejs/biome check --write . && (bunx eslint --fix '**/*.svelte' 2>/dev/null || true)",
    "lint:svelte": "bunx eslint --no-warn-ignored '**/*.svelte'",
    "lint:svelte-check": "bunx svelte-check --workspace <detected-frontend-workspace>",
    "typecheck": "bun run tsc --noEmit",
    "prepare": "husky"
  },
  "lint-staged": {
    "*.{js,ts,jsx,tsx,json,css,md}": ["bunx @biomejs/biome check --write"],
    "*.svelte": ["bunx @biomejs/biome check --write", "bunx eslint --fix"]
  }
}
```

**If Svelte = no:**
```json
{
  "scripts": {
    "lint": "bunx @biomejs/biome check .",
    "lint:fix": "bunx @biomejs/biome check --write .",
    "typecheck": "bun run tsc --noEmit",
    "prepare": "husky"
  },
  "lint-staged": {
    "*.{js,ts,jsx,tsx,json,css,md}": ["bunx @biomejs/biome check --write"]
  }
}
```

### 6. Initialize Husky

Run:
```bash
bunx husky init
```

Then update `.husky/pre-commit` to contain:
```bash
bunx lint-staged
```

### 7. Summary

Report what was created:
- Dependencies installed
- Config files created (biome.json, eslint.config.js if Svelte)
- Scripts added to package.json
- Husky pre-commit hook configured

Also mention how to use:
- `bun run lint` - Check for issues
- `bun run lint:fix` - Auto-fix issues
- `bun run typecheck` - TypeScript type checking
- Pre-commit hook will auto-run lint-staged on commits

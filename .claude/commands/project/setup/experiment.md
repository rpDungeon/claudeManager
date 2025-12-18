---
description: Set up experiments folder structure with naming conventions
allowed-tools: Bash, Write, Read
---

Set up the experiments folder structure in this project:

1. Check if `/apps/experiments` directory exists
2. If not, create it
3. Check if `/apps/experiments/CLAUDE.md` exists
4. If not, create it with the following content explaining the naming schema:

```markdown
# Experiments

This folder contains experimental code and prototypes.

## Naming Convention

Experiment folders must follow this schema:

```
YYYY-MM-DD-name
```

**Examples:**
- `2025-01-15-auth-flow-test`
- `2025-03-22-new-terminal-ui`
- `2025-12-18-websocket-perf`

**Rules:**
- Date should be the creation date
- Name should be lowercase, kebab-case
- Keep names descriptive but concise
```

Report what was created or if everything already existed.

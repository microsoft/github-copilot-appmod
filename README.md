# Custom Skills Template Repository

A template repository for hosting custom agent skills for the [GitHub Copilot App Modernization VS Code extension](https://marketplace.visualstudio.com/items?itemName=vscjava.migrate-java-to-azure).

Skills follow the open [Agent Skills](https://agentskills.io/home) specification.

## Overview

This repository serves as a template for teams to create and maintain their own custom agent skills. Clone or fork this repository to your GitHub, GitLab, or other Git hosting service to start building your own skill library.

## Quick Start

### Setting Up Your Repository

1. Clone this template repository to your GitHub, GitLab, or other Git hosting service
2. Start adding your custom skills in the `skills/` folder

### Configuring the App Modernization Extension

1. Open the **GitHub Copilot App Modernization** extension in the Side Bar.
2. Point the extension to your repository's `skills/` folder (or a custom folder path).

### Adding a New Skill

1. Create a new folder in `skills/` with your skill name (e.g., `skills/mysql-to-postgresql`)
2. Add a `SKILL.md` file following the [Skill Format Specification](#skill-format-specification)
3. Optionally add supporting files (`scripts/`, `references/`, `assets/`)
4. Run `npm start` to validate your skills
5. Commit and push your changes

## Repository Structure

```
appmod-custom-skills/
├── README.md                  # This file
├── scripts/
│   ├── validate-skill.js      # Validates skill format
│   ├── lib/                   # Shared utilities
│   └── package.json           # Node.js dependencies
└── skills/                    # All skill folders go here (default scan folder)
    └── <skill-name>/
        ├── SKILL.md           # Main skill definition (required)
        ├── scripts/           # Optional: executable scripts
        ├── references/        # Optional: additional documentation
        └── assets/            # Optional: static resources
```

## Skill Format Specification

Each skill follows the [Agent Skills specification](https://agentskills.io/specification).

### Folder Structure

Each skill must be in its own folder inside the `skills/` directory:

```
skills/
└── my-skill-name/
    ├── SKILL.md               # Required: Main skill definition
    ├── scripts/               # Optional: Executable scripts
    │   └── transform.py
    ├── references/            # Optional: Additional documentation
    │   └── REFERENCE.md
    └── assets/                # Optional: Static resources
        └── template.yml
```

### Naming Conventions

- **Folder name**: Lowercase alphanumeric with hyphens (e.g., `aws-s3-to-azure-blob`)
- **Folder name must match the `name` field** in the SKILL.md frontmatter
- Must not start or end with a hyphen
- Must not contain consecutive hyphens (`--`)
- Maximum 64 characters

### SKILL.md Requirements

The `SKILL.md` file must include YAML frontmatter followed by Markdown instructions:

```markdown
---
name: my-skill-name
description: A clear description of what this skill does and when to use it.
---

# My Skill Name

Step-by-step instructions for the agent...
```

#### Frontmatter Fields

| Field | Required | Description |
|-------|----------|-------------|
| `name` | Yes | Unique identifier, max 64 chars. Lowercase alphanumeric + hyphens. Must match folder name. |
| `description` | Yes | What the skill does and when to use it, max 1024 chars. |
| `license` | No | License name or reference to a bundled license file. |
| `compatibility` | No | Environment requirements (intended product, system packages, etc.), max 500 chars. |
| `metadata` | No | Arbitrary key-value mapping for additional metadata. |
| `allowed-tools` | No | Space-delimited list of pre-approved tools. (Experimental) |

#### Body Content

The Markdown body after the frontmatter contains the skill instructions. Recommended sections:
- Step-by-step instructions
- Examples of inputs and outputs
- Common edge cases

Keep the main `SKILL.md` under 500 lines. Move detailed reference material to the `references/` directory.

### Optional Directories

| Directory | Purpose |
|-----------|---------|
| `scripts/` | Executable code that agents can run (Python, Bash, JavaScript, etc.) |
| `references/` | Additional documentation agents can read on demand |
| `assets/` | Static resources: templates, images, data files, schemas |

## Development

### Prerequisites

- Node.js 18+
- npm

### Setup

```bash
npm install
```

### Validate Skills

Validate all skills in the default `skills/` folder:

```bash
npm start
```

Validate skills in a custom folder:

```bash
cd scripts && node validate-skill.js --dir my-custom-folder
```

Validate specific skills:

```bash
cd scripts && node validate-skill.js my-skill-name another-skill
```

### Types of Contributions

- 🆕 **New Skills**: Agent capabilities for different migration patterns
- 🐛 **Bug Fixes**: Fixes to existing skills
- 📖 **Documentation**: Improvements to skill documentation

## Learn More

- [Agent Skills Specification](https://agentskills.io/specification)
- [What are Agent Skills?](https://agentskills.io/what-are-skills)
- [Example Skills](https://github.com/anthropics/skills)

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

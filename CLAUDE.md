# Salesforce CLI Plugin Templates — AI Context

## Purpose

This repository (`plugin-templates`) exposes template generators to Salesforce CLI users via `sf template generate` commands.

It works alongside a separate repo:

- `salesforcedx-templates` → contains generator logic
- `plugin-templates` → exposes generators as CLI commands

**Important:**  
Creating a generator in `salesforcedx-templates` does NOT expose it to CLI users.  
A command must be added in this repo.

---

## When Performing Tasks

- Adding a generator command → use the **add-template-generator skill**
- Do not manually scaffold commands unless necessary
- Follow conventions exactly — CLI discovery depends on them

---

## Command Architecture

Command structure:

src/commands/template/generate/{metadataType}/

Files:
- index.ts → top-level generator
- {subTemplate}.ts → nested generator

Naming pattern:

sf template generate {metadataType} {optionalSubTemplate}

Examples:
- sf template generate flexipage
- sf template generate digital-experience site

---

## Flag Definitions Source of Truth

CLI flags should be derived from the TypeScript interface of the corresponding template generator in `salesforcedx-templates`.

When implementing a command:

- Prefer inspecting the generator interface to determine flags
- If the interface is not available in context, request it
- Do not invent flags unless explicitly instructed

## Critical Rules

These must always be followed:

- File paths must match conventions exactly
- All flags must have message file entries
- GA commands must remain backward compatible
- Hidden commands:

  static hidden = true;

  will not appear in docs or autocomplete

---

## Command States

beta  
preview  
GA (default)

Only GA commands require permanent backwards compatibility.

---

## Tech Stack

- TypeScript
- oclif framework
- sf-plugins-core utilities
- Yarn 1 only

---

## Core Implementation Pattern

All generators should call:

runGenerator({
  templateType: TemplateType.X,
  opts: flags,
  ux
})

---

## Reference Docs

Use official Salesforce CLI docs when needed.
---
description: Add a new template generator command to the CLI
---
Use this workflow whenever exposing a generator from salesforcedx-templates to CLI users.

# Add Template Generator Command Workflow

This workflow guides you through adding a new template generator command that exposes a template from `salesforcedx-templates` to the Salesforce CLI.

## Prerequisites

- Template generator already exists in `salesforcedx-templates` repository
- You know the metadata type name and any subtemplates
- You have the repo cloned and dependencies installed

## Step 1: Bootstrap the Command

// turbo
Run the command generator to create the initial command structure:

```bash
sf dev generate command -n template:generate:{metadataType}:{optionalSubTemplate} --no-unit
```

**Notes:**
- Replace `{metadataType}` with your metadata type (e.g., `flexipage`, `apex`)
- Only add `{optionalSubTemplate}` if you need nested generators (e.g., `digital-experience:site`)
- This creates the command file, updates oclif metadata, and adds NUTs

## Step 2: Update package.json Topics

Open `package.json` and locate the `oclif.topics` section. Under `template > generate`, add a description for your new subtopic:

```json
{
  "oclif": {
    "topics": {
      "template": {
        "subtopics": {
          "generate": {
            "subtopics": {
              "{metadataType}": {
                "description": "Commands for generating {metadataType} metadata"
              }
            }
          }
        }
      }
    }
  }
}
```

## Step 3: Set Command State (Optional)

If your command is not GA-ready, add a state to the command class:

```typescript
public static readonly state = 'beta'; // or 'preview'
```

**State options:**
- `beta`: Shows beta warning to users
- `preview`: Shows preview warning to users
- No state: Command is GA (requires backwards compatibility)

If you want to hide the command from docs and autocomplete:

```typescript
public static readonly hidden = true;
```

**Note:** Hidden commands won't be included in release notes.

## Step 4: Verify File Path

Ensure your command file follows the correct path convention:

- **Single top-level generator**: `src/commands/template/generate/{metadataType}/index.ts`
- **Nested generator**: `src/commands/template/generate/{metadataType}/{subTemplate}.ts`

## Step 5: Define CLI Flags
Before defining flags, inspect the generator TypeScript interface in `salesforcedx-templates`. The interface is the source of truth for flag structure. If it is unavailable, request it instead of guessing.

// turbo
Use the interactive flag generator for each flag you need:

```bash
sf dev generate flag
```

This will:
- Add the flag to your command's `flags` object
- Generate TypeScript types
- Add entries to the `messages.md` file

**Common flags to consider:**
- `--name` / `-n`: Name of the generated item (usually required)
- `--output-dir` / `-d`: Output directory (default: '.')
- `--template` / `-t`: Template type selection (if multiple templates)
- `--api-version`: API version override

## Step 6: Review Message Files

Check the generated `messages/{command}.md` file and ensure:
- Summary is clear and concise
- Description provides helpful context
- Flag descriptions are detailed and explain constraints
- Examples are practical and cover common use cases

**Optional:** Add links to developer.salesforce.com docs in descriptions if helpful.

## Step 7: Implement the run() Method

Update the `run()` method to call `runGenerator`:

```typescript
import { runGenerator } from '../../utils/templateCommand.js';

public async run(): Promise<CreateOutput> {
  const { flags } = await this.parse(CommandClass);
  
  // Add any pre-processing or validation here
  
  return runGenerator({
    templateType: TemplateType.{YourMetadataType},
    opts: flags,
    ux: new Ux({ jsonEnabled: this.jsonEnabled() }),
  });
}
```

## Step 8: Write/Update NUTs

Review the auto-generated NUTs in `test/commands/template/generate/{metadataType}/`. Add tests to validate:
- Required flags work correctly
- Optional flags are respected
- Correct files are created in the right locations
- Flag combinations work as expected

Most template generators don't require scratch org connections.

## Step 9: Test Locally

// turbo
Build and link the plugin:

```bash
yarn build
sf plugins link .
```

Test your command:

```bash
sf template generate {metadataType} --name TestExample --output-dir ./test-output
```

Verify the generated files are correct.

## Step 10: Run Tests

// turbo
Run the NUTs to ensure everything works:

```bash
yarn test
```

## Local Development with salesforcedx-templates

If you're also working on the template in `salesforcedx-templates`:

1. Ensure you're using yarn 1
2. Update `package.json` to reference your local `salesforcedx-templates`:
   ```json
   "dependencies": {
     "salesforcedx-templates": "file:../path/to/salesforcedx-templates"
   }
   ```
3. After template changes: `yarn build` in salesforcedx-templates
4. Then: `yarn install --force && yarn build` in plugin-templates

## Troubleshooting

If your command does not appear:

- confirm file path matches convention
- run yarn build
- ensure oclif topics updated
- relink plugin:

  sf plugins unlink @salesforce/plugin-templates
  sf plugins link .

## Final Validation Checklist

Before opening PR ensure:

- command runs locally
- files generate correctly
- flags validated
- messages documented
- NUTs pass
- topics updated
# examples

- Generate from a JSON definition file (like "sf org create scratch --definition-file", the whole input set — including the nested eca block — lives in one file):

  <%= config.bin %> <%= command.id %> --definition-file lo-def.json

- Generate from individual flags (discoverable via --help; the nested eca block is flattened into --eca-* flags):

  <%= config.bin %> <%= command.id %> --name MyLoApp --runtime LWR_CORE --components c/helloWorld --components c/myLwc --host-domains https://example.com --eca-contact-email dev@example.com

- Generate from a directory of flag files with the global --flags-dir (one file per flag, filename = flag name; handy for CI or long/many values):

  <%= config.bin %> <%= command.id %> --flags-dir ./config/lo-flags

- Generate into a specific directory:

  <%= config.bin %> <%= command.id %> --definition-file lo-def.json --output-dir force-app/main/default

- Overwrite files from a previous run:

  <%= config.bin %> <%= command.id %> --definition-file lo-def.json --force

# summary

Generate the metadata scaffold for a Lightning Out 2.0 application.

# description

Generates the seven metadata artifact types a Lightning Out 2.0 app requires: LightningOutApp, IframeWhiteListUrlSettings, MyDomain and Security settings, one CorsWhitelistOrigin per host domain, and the External Client Application OAuth trio (ExternalClientApplication, ExtlClntAppGlobalOauthSettings, ExtlClntAppOauthSettings). The command is generate-only; it does not deploy.

IMPORTANT: Deploying the generated IframeWhiteListUrlSettings REPLACES your org's entire "Trusted Domains for Inline Frames" list (Setup > Security > Session Settings), across every IFrame Type.

# flags.definition-file.summary

Path to a JSON file describing the Lightning Out 2.0 app.

# flags.definition-file.description

The JSON must contain: name (a valid Metadata API name), runtime (LWR_CORE or CLWR), components (a non-empty array of Lightning web component names), hostDomains (a non-empty array of https origins), and eca (at least a contactEmail; optionally distributionState, callbackUrl, and oauthScopes).

# flags.name.summary

Metadata API name of the Lightning Out 2.0 app.

# flags.runtime.summary

Runtime the app targets: LWR_CORE or CLWR.

# flags.components.summary

Name of a Lightning web component exposed by the app (repeatable).

# flags.host-domains.summary

An https origin of an external host page that embeds the app (repeatable).

# flags.eca-contact-email.summary

Contact email for the External Client Application (OAuth).

# flags.eca-distribution-state.summary

Distribution state of the External Client Application: Local or Packaged.

# flags.eca-callback-url.summary

OAuth callback URL for the External Client Application.

# flags.eca-oauth-scopes.summary

An OAuth scope granted to the External Client Application (repeatable).

# error.missing-inputs

Missing required input(s): %s. Provide them via --definition-file, individual flags, or --flags-dir.

# flags.force.summary

Overwrite existing files instead of erroring.

# flags.force.description

By default, generation fails if any target file already exists, so a re-run never silently overwrites your edits — notably the REPLACE-type IframeWhiteListUrlSettings file. Pass --force to overwrite.

# flags.no-prompt.summary

Don't prompt for confirmation before generating the REPLACE-type iframe file.

# flags.no-prompt.description

By default the command asks you to confirm before writing the generated IframeWhiteListUrlSettings file, since deploying it later replaces your org's entire trusted-domains list. Pass --no-prompt to skip the confirmation (for scripting/CI). The prompt is also skipped automatically with --json or in a non-interactive terminal.

# warning.iframe-replace

The generated IframeWhiteListUrlSettings lists only this app's host domains. Deploying it REPLACES your org's entire "Trusted Domains for Inline Frames" list across all IFrame Types — any existing entries not in the generated file are removed on deploy.

# prompt.iframe-confirm

Continue generating the Lightning Out scaffold?

# info.cancelled-remediation

Cancelled. To deploy without losing your org's existing trusted domains, merge them in first:
  1. sf project retrieve start --metadata IframeWhiteListUrlSettings --target-org <org>
  2. Add this app's host domains to the retrieved IframeWhiteListUrlSettings file
  3. sf project deploy start --metadata IframeWhiteListUrlSettings --target-org <org>
Then re-run this command with --no-prompt to generate the scaffold.

# error.definition-file-read

Unable to read definition file %s: %s

# error.definition-file-json

Definition file %s is not valid JSON: %s

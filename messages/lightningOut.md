# examples

- Generate from individual flags (discoverable via --help; the nested eca block is flattened into --eca-\* flags):

  <%= config.bin %> <%= command.id %> --app-name MyLoApp --runtime LWR_CORE --host-domains https://example.com --eca-name MyLoAppEca --eca-contact-email dev@example.com --eca-callback-url https://example.com/cb

- Generate from a JSON definition file (like "sf org create scratch --definition-file", the whole input set — including the nested eca block — lives in one file):

  <%= config.bin %> <%= command.id %> --definition-file lo-def.json

- Generate into a specific directory:

  <%= config.bin %> <%= command.id %> --definition-file lo-def.json --output-dir force-app/main/default

- Mix a definition file with an override flag (flags win over the file, per key):

  <%= config.bin %> <%= command.id %> --definition-file lo-def.json --host-domains https://staging.example.com

# summary

Generate the metadata scaffold for a Lightning Out 2.0 application.

# description

Generates the seven metadata artifact types a Lightning Out 2.0 app requires: LightningOutApp, MyDomain and Security settings, one CorsWhitelistOrigin per host domain, and the External Client Application OAuth trio (ExternalClientApplication, ExtlClntAppGlobalOauthSettings, ExtlClntAppOauthSettings). The command is generate-only; it does not deploy and never contacts an org.

Inputs may come from a --definition-file JSON, individual flags, or both — flags take precedence over the file on a per-key basis. All structural validation (required fields, formats) is performed by the underlying generator.

# flags.app-name.summary

Metadata API name of the Lightning Out 2.0 app.

# flags.eca-name.summary

Metadata API name of the External Client Application (OAuth) associated with the app.

# flags.runtime.summary

Runtime the app targets: LWR_CORE or CLWR. CLWR is experimental.

# flags.host-domains.summary

An https origin of an external host page that embeds the app (repeatable). Replaces, rather than merges with, any hostDomains in --definition-file.

# flags.components.summary

Name of a Lightning web component exposed by the app (repeatable). Replaces, rather than merges with, any components in --definition-file.

# flags.eca-contact-email.summary

Contact email for the External Client Application (OAuth).

# flags.eca-callback-url.summary

OAuth callback URL for the External Client Application.

# flags.definition-file.summary

Path to a JSON file describing the Lightning Out 2.0 app. Individual flags, when supplied, override the corresponding value from this file.

# error.definition-file-json

Definition file %s is not valid JSON: %s

# error.definition-file-not-object

Definition file %s must contain a single JSON object, not an array or scalar.

# warning.unknown-definition-key

Ignoring unrecognized key "%s" in --definition-file.

# warning.source-api-version

Your local project's sourceApiVersion (%s) is below 68.0, the minimum API version this scaffold supports for deployment. Set sourceApiVersion to 68.0 or later in sfdx-project.json, or pass --api-version 68.0 or later when you deploy.

# success.next-step

Scaffold generated in %s. Deploy it with: sf project deploy start -d %s --api-version 68.0

# success.app-id

After deploying, note the LightningOutApp's App ID from Setup — your host page needs it to embed the app.

# success.dont-delete

Don't delete the generated ExternalClientApplication after deploying — Lightning Out uses it for OAuth at runtime.

# success.eca-overwrite

Re-running this command overwrites the generated files for the "%s" External Client Application; back up local edits first.

# success.components-exist

Verify that every component you referenced already exists and is exposed for Lightning Out before deploying.

# success.frontdoor

For CLWR, host pages must complete a frontdoor.jsp handoff before the embedded app can authenticate.

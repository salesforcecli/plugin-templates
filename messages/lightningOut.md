# examples

- Generate a Lightning Out 2.0 app using individual flags to specify the values:

  <%= config.bin %> <%= command.id %> --app-name MyLoApp --runtime LWR_CORE --host-domains https://example.com --eca-name MyLoAppEca --eca-contact-email dev@example.com --eca-callback-url https://example.com/cb

- Generate an app using the values in a JSON definition file called lo-def.json:

  <%= config.bin %> <%= command.id %> --definition-file lo-def.json

- Generate the app into a specific directory:

  <%= config.bin %> <%= command.id %> --definition-file lo-def.json --output-dir force-app/main/default

- Generate the app using most of the values from a definition file, but the --host-domains value overrides its equivalent in the file:

  <%= config.bin %> <%= command.id %> --definition-file lo-def.json --host-domains https://staging.example.com

# summary

Generate the required metadata to scaffold a Lightning Out 2.0 app.

# description

Lightning Out 2.0 is a Salesforce app that you use to embed custom Lightning web components (LWC) into your external, non-Salesforce apps.

This command gets you started by generating into your Salesforce DX project the seven metadata artifact types that a Lightning Out 2.0 app requires: LightningOutApp, MyDomain and Security settings, one CorsWhitelistOrigin per host domain, and the External Client Application OAuth trio (ExternalClientApplication, ExtlClntAppGlobalOauthSettings, ExtlClntAppOauthSettings). The command is generate-only; it doesn't deploy any metadata to an org.

Inputs may come from a --definition-file JSON, individual flags, or both. Flag values take precedence over the file on a per-key basis. The command validates the types of definition-file fields; the underlying generator performs the remaining structural validation, such as required fields and formats.

# flags.app-name.summary

Developer name of the new Lightning Out 2.0 app.

# flags.eca-name.summary

Developer name of the External Client Application (OAuth) associated with the app.

# flags.runtime.summary

Runtime the app targets. LWR_CORE serves from your Salesforce org for authenticated users; CLWR serves from an Experience Cloud site (guest access, extra site-deployment step).

# flags.host-domains.summary

HTTP or HTTPS origin of an external host page that embeds the app; can be specified multiple times. Replaces, rather than merges with, any hostDomains specified in the --definition-file.

# flags.components.summary

Name of a Lightning web component exposed by the app; can be specified multiple times. Replaces, rather than merges with, any components specified in the --definition-file.

# flags.eca-contact-email.summary

Contact email for the External Client Application (OAuth).

# flags.eca-callback-url.summary

OAuth callback URL for the External Client Application.

# flags.definition-file.summary

Path to a JSON file describing the Lightning Out 2.0 app. Individual flags, when supplied, override the corresponding value in this file.

# error.definition-file-json

Definition file %s is not valid JSON: %s

# error.definition-file-not-object

Definition file %s must contain a single JSON object, not an array or scalar.

# error.definition-file-field-type

Definition file field "%s" must be %s.

# warning.unknown-definition-key

Ignoring unrecognized key "%s" in --definition-file.

# warning.source-api-version

Your local project's sourceApiVersion (%s) is below 68.0, the minimum API version this scaffold supports for deployment. Set sourceApiVersion to 68.0 or later in sfdx-project.json, or pass --api-version 68.0 or later when you deploy.

# success.next-step

Scaffold generated in %s. Deploy it with: sf project deploy start --source-dir %s%s

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

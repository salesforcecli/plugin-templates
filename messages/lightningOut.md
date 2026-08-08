# examples

- Generate a Lightning Out 2.0 scaffold from a definition file into the current directory:

  <%= config.bin %> <%= command.id %> --definition-file lo-def.json

- Generate into a specific directory:

  <%= config.bin %> <%= command.id %> --definition-file lo-def.json --output-dir force-app/main/default

- Overwrite files from a previous run:

  <%= config.bin %> <%= command.id %> --definition-file lo-def.json --force

- Preserve the org's existing Trusted Domains for Inline Frames (retrieve-merge) instead of replacing them:

  <%= config.bin %> <%= command.id %> --definition-file lo-def.json --merge-iframe --target-org myOrg

# summary

Generate the metadata scaffold for a Lightning Out 2.0 application.

# description

Generates the seven metadata artifact types a Lightning Out 2.0 app requires: LightningOutApp, IframeWhiteListUrlSettings, MyDomain and Security settings, one CorsWhitelistOrigin per host domain, and the External Client Application OAuth trio (ExternalClientApplication, ExtlClntAppGlobalOauthSettings, ExtlClntAppOauthSettings). The command is generate-only; it does not deploy.

IMPORTANT: Deploying the generated IframeWhiteListUrlSettings REPLACES your org's entire "Trusted Domains for Inline Frames" list (Setup > Security > Session Settings), across every IFrame Type. By default the generated file contains only this app's host domains. To preserve the org's existing entries, pass --merge-iframe with --target-org; the command then retrieves the current list and merges this app's domains into it.

# flags.definition-file.summary

Path to a JSON file describing the Lightning Out 2.0 app.

# flags.definition-file.description

The JSON must contain: name (a valid Metadata API name), runtime (LWR_CORE or CLWR), components (a non-empty array of Lightning web component names), hostDomains (a non-empty array of https origins), and eca (at least a contactEmail; optionally distributionState, callbackUrl, and oauthScopes).

# flags.force.summary

Overwrite existing files instead of erroring.

# flags.force.description

By default, generation fails if any target file already exists, so a re-run never silently overwrites your edits — notably the REPLACE-type IframeWhiteListUrlSettings file. Pass --force to overwrite.

# flags.merge-iframe.summary

Preserve the org's existing Trusted Domains for Inline Frames by merging into them.

# flags.merge-iframe.description

Retrieves the target org's current IframeWhiteListUrlSettings and re-emits every existing entry (across all IFrame Types) into the generated file, then adds this app's host domains. Requires --target-org. Without this flag, the generated file contains only this app's host domains and deploying it REPLACES the org's entire list.

# flags.target-org.summary

Org whose Trusted Domains for Inline Frames list is retrieved when --merge-iframe is set.

# warning.iframe-replace

The generated IframeWhiteListUrlSettings lists only this app's host domains. Deploying it REPLACES your org's entire "Trusted Domains for Inline Frames" list across all IFrame Types. To preserve existing entries, re-run with --merge-iframe --target-org <org>.

# info.merged-iframe-count

Retrieved %s existing Trusted Domains for Inline Frames entries from the org; the generated file merges this app's host domains into them.

# error.merge-iframe-requires-org

--merge-iframe requires a target org. Pass --target-org <username-or-alias>.

# error.definition-file-read

Unable to read definition file %s: %s

# error.definition-file-json

Definition file %s is not valid JSON: %s

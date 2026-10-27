# examples

- Generate a Lightning Out 2.0 app using individual flags to specify the values:

  <%= config.bin %> <%= command.id %> --app-name MyLoApp --runtime LWR_CORE --host-domains https://example.com --eca-name MyLoAppEca --eca-contact-email dev@example.com --eca-callback-url https://example.com/cb

- Generate an app using the values in a JSON definition file called lo-def.json:

  <%= config.bin %> <%= command.id %> --definition-file lo-def.json

- Generate the app into a specific directory:

  <%= config.bin %> <%= command.id %> --definition-file lo-def.json --output-dir force-app/main/default

- Generate a CLWR app for an Experience Cloud site using a definition file:

  <%= config.bin %> <%= command.id %> --runtime CLWR --definition-file lo-def.json

- Generate the app using most of the values from a definition file, but the --host-domains value overrides its equivalent in the file:

  <%= config.bin %> <%= command.id %> --definition-file lo-def.json --host-domains https://staging.example.com

# summary

Generate the required metadata to scaffold a Lightning Out 2.0 app.

# description

Lightning Out 2.0 lets you embed custom Lightning web components (LWCs) into your external, non-Salesforce apps.

This command gets you started by generating the seven metadata artifact types that a Lightning Out 2.0 app requires into your Salesforce DX project: LightningOutApp, MyDomain and Security settings, one CorsWhitelistOrigin per host domain, and the three External Client Application OAuth components (ExternalClientApplication, ExtlClntAppGlobalOauthSettings, ExtlClntAppOauthSettings). The command only generates files. It doesn't deploy any metadata to an org.

Inputs can come from a --definition-file JSON, individual flags, or both. Flag values take precedence over the file on a per-key basis. The command validates the types of definition-file fields; the underlying generator performs the remaining structural validation, such as required fields and formats.

# flags.app-name.summary

Developer name of the new Lightning Out 2.0 app.

# flags.eca-name.summary

Developer name of the External Client Application associated with the app.

# flags.runtime.summary

Runtime that serves the app.

# flags.runtime.description

LWR_CORE serves the app from your Salesforce org to authenticated users. CLWR serves it from an Experience Cloud site to guest and authenticated users. After you deploy a CLWR app, link it to your site in Setup.

# flags.host-domains.summary

HTTP or HTTPS origin of an external host page that embeds the app. Repeat the flag to specify more than one. Replaces, rather than merges with, any hostDomains in the --definition-file. For CLWR apps, host domains are used only for CORS, which authenticated users need. Set up framing for the site in Experience Builder.

# flags.components.summary

Name of a Lightning web component exposed by the app. Repeat the flag to specify more than one. Replaces, rather than merges with, any components in the --definition-file.

# flags.eca-contact-email.summary

Contact email for the External Client Application.

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

# warning.org-settings

Deploying the generated MyDomain and Security settings changes two org-wide settings: isFirstPartyCookieUseRequired is set to false (Require first-party use of Salesforce cookies) and enableOauthCorsPolicy is set to true (Enable CORS for OAuth endpoints). These settings affect every app in the org, so review them before you deploy to a production org.

# success.next-step

Scaffold generated in %s. Deploy it with: sf project deploy start --source-dir %s%s

# success.app-id

After deploying, from Setup, in the Quick Find box, enter Lightning Out, and then select "Lightning Out 2.0 App Manager". Copy the App ID and set it as the "app-id" attribute on the <lightning-out-application> tag on your host page. Without it, your host domains aren't added to the CSP frame-ancestors directive, and the browser blocks the app from loading on your host page.

# success.dont-delete

Don't delete the generated External Client Application after deploying. Lightning Out 2.0 uses it for OAuth at runtime.

# success.eca-overwrite

Re-running this command overwrites the generated files for the "%s" External Client Application. Back up local edits first.

# success.components-exist

Verify that every component you referenced already exists and is exposed for Lightning Out 2.0 before deploying.

# success.clwr-site

Link the app to your Experience Cloud site after deploying. From Setup, in the Quick Find box, enter Lightning Out, and then select "Lightning Out 2.0 App Manager". Edit the app, select your site on the "Linked Communities Site" tab, and save. Then follow the steps in the "Complete Deployment in Experience Builder" dialog, which include publishing the site. On your host page, set the "site-prefix" attribute on the <lightning-out-application> tag to your site's URL path prefix, for example "/mysite". For host-page setup, see "Use Components Outside Salesforce with Lightning Out 2.0" in the Lightning Web Components Developer Guide.

# examples

- Generate a Lightning Out 2.0 app using individual flags to specify the values:

  <%= config.bin %> <%= command.id %> --app-name MyLoApp --runtime LWR_CORE --host-domains https://example.com --eca-name MyLoAppEca --eca-contact-email dev@example.com --eca-callback-url https://example.com/cb

- Generate an app using the values in a JSON definition file called lo-def.json:

  <%= config.bin %> <%= command.id %> --definition-file lo-def.json

- Generate the app into a specific directory:

  <%= config.bin %> <%= command.id %> --definition-file lo-def.json --output-dir force-app/main/default

- Generate a CLWR app for authenticated users of the Experience Cloud site named "My Site", using a definition file for the other values:

  <%= config.bin %> <%= command.id %> --runtime CLWR --site "My Site" --definition-file lo-def.json

- Generate a CLWR app for guest users of an Experience Cloud site. Guest access generates only the LightningOutApp file, so no External Client Application or host-domain values are needed:

  <%= config.bin %> <%= command.id %> --app-name MyLoApp --runtime CLWR --access guest --site "My Site" --components c/myHeader

- Generate the app using most of the values from a definition file, but the --host-domains value overrides its equivalent in the file:

  <%= config.bin %> <%= command.id %> --definition-file lo-def.json --host-domains https://staging.example.com

# summary

Generate the required metadata to scaffold a Lightning Out 2.0 app.

# description

Lightning Out 2.0 lets you embed custom Lightning web components (LWCs) into your external, non-Salesforce apps.

This command gets you started by generating the seven metadata artifact types that a Lightning Out 2.0 app requires into your Salesforce DX project: LightningOutApp, MyDomain and Security settings, one CorsWhitelistOrigin per host domain, and the three External Client Application OAuth components (ExternalClientApplication, ExtlClntAppGlobalOauthSettings, ExtlClntAppOauthSettings). For a CLWR app with --access guest, the command generates only the LightningOutApp, because guest users don't sign in. The command only generates files. It doesn't deploy any metadata to an org. When you deploy the generated LightningOutApp, its components and host domains replace the app's existing ones in the org, including any that were added in Setup, so list all of them.

Inputs can come from a --definition-file JSON, individual flags, or both. Flag values take precedence over the file on a per-key basis. The command validates the types of definition-file fields; the underlying generator performs the remaining structural validation, such as required fields and formats.

# flags.app-name.summary

Developer name of the new Lightning Out 2.0 app.

# flags.eca-name.summary

Developer name of the External Client Application associated with the app.

# flags.runtime.summary

Runtime that serves the app.

# flags.runtime.description

LWR_CORE serves the app from your Salesforce org to authenticated users. CLWR serves it from an Experience Cloud site to guest or authenticated users; specify the site with --site and the type of user with --access.

# flags.host-domains.summary

HTTP or HTTPS origin of an external host page that embeds the app. Repeat the flag to specify more than one. Replaces, rather than merges with, any hostDomains in the --definition-file. For CLWR apps, host domains are written to the app's allowed domains and, with --access authenticated, to CORS entries. They're optional with --access guest. For CLWR, also add them to the site's trusted domains and set up framing for the site in Experience Builder.

# flags.components.summary

Name of a Lightning web component exposed by the app. Repeat the flag to specify more than one. Replaces, rather than merges with, any components in the --definition-file.

# flags.eca-contact-email.summary

Contact email for the External Client Application.

# flags.eca-callback-url.summary

OAuth callback URL for the External Client Application.

# flags.site.summary

Name of the Experience Cloud site to link a CLWR app to.

# flags.site.description

Use the site name that's shown on the All Sites page in Setup, not the site's URL path prefix. The site must be active and built with the Lightning Out (LWR) template (a Build Your Own (LWR) site is also accepted, but it needs a Lightning Out page to serve the app). Applies only to runtime CLWR. The site is linked when you deploy the app, which requires API version 69.0 or later. At API version 69.0 and later, or when the project's API version can't be determined, the flag is required for CLWR, because deploying a CLWR app without a site can remove the app's existing site link. An app can link to only one site.

# flags.access.summary

Type of Experience Cloud site user who accesses a CLWR app.

# flags.access.description

"authenticated" (the default) generates the app plus the External Client Application, CORS, and org settings that logged-in site users need. "guest" generates only the app, because guest users don't sign in. Applies only to runtime CLWR.

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

# warning.unknown-definition-key-suggest

Ignoring unrecognized key "%s" in --definition-file. Did you mean "%s"?

# error.clwr-site-required

A CLWR app needs a site. Specify the name of the Experience Cloud site to link the app to with --site, or with "site" in the definition file. Your local project's sourceApiVersion is %s. At API version 69.0 and later, deploying a CLWR app without a site can remove the app's existing site link.

# error.clwr-site-required-no-project

A CLWR app needs a site. Specify the name of the Experience Cloud site to link the app to with --site, or with "site" in the definition file. At API version 69.0 and later, deploying a CLWR app without a site can remove the app's existing site link. No sourceApiVersion was found, because the output directory isn't in a Salesforce DX project or its sfdx-project.json doesn't set sourceApiVersion. To generate an app without a site for an earlier API version, generate it into a Salesforce DX project whose sourceApiVersion is earlier than 69.0.

# error.clwr-site-required-cwd

A CLWR app needs a site. Specify the name of the Experience Cloud site to link the app to with --site, or with "site" in the definition file. The current directory is in a different Salesforce DX project from --output-dir, and "sf project deploy start" run from here uses that project's sourceApiVersion (%s). At API version 69.0 and later, deploying a CLWR app without a site can remove the app's existing site link.

# warning.cwd-api-version

The current directory is in a different Salesforce DX project from --output-dir, with sourceApiVersion %s. "sf project deploy start" uses the sourceApiVersion of the project it runs from, and this app needs %s or later, so deploy from the project that contains --output-dir.

# warning.site-api-version

Linking a site requires API version 69.0 or later, but your local project's sourceApiVersion is %s, so deploying the generated app fails. Set sourceApiVersion to 69.0 or later in sfdx-project.json before you deploy. The --api-version flag of the deploy command doesn't change the metadata version, so it doesn't help.

# warning.site-no-project

Linking a site requires API version 69.0 or later. No sourceApiVersion was found, because the output directory isn't in a Salesforce DX project or its sfdx-project.json doesn't set sourceApiVersion. Make sure that the project you deploy from has sourceApiVersion 69.0 or later.

# warning.site-unknown-version

Linking a site requires API version 69.0 or later, but your local project's sourceApiVersion "%s" isn't an API version such as 69.0. Set sourceApiVersion to 69.0 or later in sfdx-project.json before you deploy.

# warning.guest-eca-ignored

Guest access doesn't use an External Client Application, so these inputs are ignored: %s.

# warning.guest-stale-files

%s also contains External Client Application, CORS, or org settings files. Guest access doesn't need them, and they might be from an earlier run or belong to other apps. If you deploy the whole directory, they're deployed too, so check them first: %s

# warning.source-api-version

Your local project's sourceApiVersion (%s) is below 68.0, the minimum API version this scaffold supports for deployment. Set sourceApiVersion to 68.0 or later in sfdx-project.json before you deploy. The --api-version flag of the deploy command doesn't change the metadata version, so it doesn't help.

# warning.org-settings

Deploying the generated MyDomain and Security settings changes two org-wide settings: isFirstPartyCookieUseRequired is set to false (Require first-party use of Salesforce cookies) and enableOauthCorsPolicy is set to true (Enable CORS for OAuth endpoints). These settings affect every app in the org, so review them before you deploy to a production org.

# success.next-step

Scaffold generated in %s. Deploy it with: sf project deploy start --source-dir %s

# success.app-id

After deploying, from Setup, in the Quick Find box, enter Lightning Out, and then select "Lightning Out 2.0 App Manager". Copy the App ID and set it as the "app-id" attribute on the <lightning-out-application> tag on your host page. Without it, your host domains aren't added to the CSP frame-ancestors directive, and the browser blocks the app from loading on your host page.

# success.dont-delete

Don't delete the generated External Client Application after deploying. Lightning Out 2.0 uses it for OAuth at runtime.

# success.eca-overwrite

Re-running this command overwrites the generated files for the "%s" External Client Application. Back up local edits first.

# success.components-exist

Verify that every component you referenced already exists and is exposed for Lightning Out 2.0 before deploying.

# success.access-default

Generated the files that authenticated site users need, including the External Client Application, CORS, and org settings. For guest-only access, specify --access guest instead.

# success.clwr-site-linked

Deploying the app links it to the "%s" Experience Cloud site. To finish setting up the site, add your host domains to the site's trusted domains and set its framing in Experience Builder, and then publish the site. On your host page, set the "site-prefix" attribute on the <lightning-out-application> tag to your site's URL path prefix, for example "/mysite". For host-page setup, see "Use Components Outside Salesforce with Lightning Out 2.0" in the Lightning Web Components Developer Guide.

# success.clwr-guest-public

For guest access, also make the site page that serves the app public before you publish the site.

# success.site-relink

An app can link to only one site. Deploying the app replaces any site that it's already linked to.

# success.clwr-site

Link the app to your Experience Cloud site after deploying. From Setup, in the Quick Find box, enter Lightning Out, and then select "Lightning Out 2.0 App Manager". Edit the app, select your site on the "Linked Communities Site" tab, and save. Then follow the steps in the "Complete Deployment in Experience Builder" dialog, which include publishing the site. On your host page, set the "site-prefix" attribute on the <lightning-out-application> tag to your site's URL path prefix, for example "/mysite". For host-page setup, see "Use Components Outside Salesforce with Lightning Out 2.0" in the Lightning Web Components Developer Guide. If you later set sourceApiVersion to 69.0 or later, regenerate the app with --site before you redeploy it, because deploying it without a site at API version 69.0 or later removes the site link.

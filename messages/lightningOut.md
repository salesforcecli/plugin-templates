# examples

- Generate a Lightning Out 2.0 app using individual flags to specify the values:

  <%= config.bin %> <%= command.id %> --app-name MyLoApp --runtime LWR_CORE --host-domains https://example.com --eca-name MyLoAppEca --eca-contact-email dev@example.com --eca-callback-url https://example.com/cb

- Generate an app using the values in a JSON definition file called lo-def.json:

  <%= config.bin %> <%= command.id %> --definition-file lo-def.json

- Generate the app into a specific directory:

  <%= config.bin %> <%= command.id %> --definition-file lo-def.json --output-dir force-app/main/default

- Generate a CLWR app for authenticated users (the default) of the Experience Cloud site named "My Site", using a definition file for the other values:

  <%= config.bin %> <%= command.id %> --runtime CLWR --site "My Site" --definition-file lo-def.json

- Generate a CLWR app for guest users of the Experience Cloud site named "My Site":

  <%= config.bin %> <%= command.id %> --app-name MyLoApp --runtime CLWR --access guest --site "My Site" --components c/myHeader

- Generate the app using most of the values from a definition file, but the --host-domains value overrides its equivalent in the file:

  <%= config.bin %> <%= command.id %> --definition-file lo-def.json --host-domains https://staging.example.com

# summary

Generate the required metadata to scaffold a Lightning Out 2.0 app.

# description

Lightning Out 2.0 lets you embed custom Lightning web components (LWCs) into your external, non-Salesforce apps.

This command gets you started by generating the seven metadata artifact types that a Lightning Out 2.0 app requires into your Salesforce DX project: LightningOutApp, MyDomain and Security settings, one CorsWhitelistOrigin per host domain, and the three External Client Application OAuth components (ExternalClientApplication, ExtlClntAppGlobalOauthSettings, ExtlClntAppOauthSettings). For a CLWR app with --access guest, the command generates only the LightningOutApp, because guest users don't log in. The command only generates files. It doesn't deploy any metadata to an org. When you deploy the generated LightningOutApp, its components and host domains replace the app's existing ones in the org, including any added in Setup. List every component and host domain the app needs, not just the new ones.

Inputs can come from a --definition-file JSON, individual flags, or both. Flag values take precedence over the file on a per-key basis. The command validates the types of definition-file fields; the underlying generator performs the remaining structural validation, such as required fields and formats.

# flags.app-name.summary

Developer name of the new Lightning Out 2.0 app.

# flags.eca-name.summary

Developer name of the External Client Application associated with the app.

# flags.runtime.summary

Runtime that serves the app.

# flags.runtime.description

LWR_CORE serves the app from your Salesforce org to authenticated users. CLWR serves it from an Experience Cloud site to guest and authenticated users. For CLWR, specify the site with --site and the type of user with --access.

# flags.host-domains.summary

HTTP or HTTPS origin of an external host page that embeds the app.

# flags.host-domains.description

Repeat the flag to specify more than one. Replaces, rather than merges with, any hostDomains in the --definition-file. Not used for CLWR with --access guest.

# flags.components.summary

Name of a Lightning web component exposed by the app. Repeat the flag to specify more than one. Replaces, rather than merges with, any components in the --definition-file.

# flags.eca-contact-email.summary

Contact email for the External Client Application.

# flags.eca-callback-url.summary

OAuth callback URL for the External Client Application.

# flags.site.summary

Name of the Experience Cloud site to link a CLWR app to.

# flags.site.description

Use the site name shown on the All Sites page in Setup, not its URL path prefix. The site must be active and use the Lightning Out (LWR) or Build Your Own (LWR) template. Used only with --runtime CLWR. To deploy an app that's linked to a site, use API version 69.0 or later. This flag is required for CLWR unless the project's sourceApiVersion is below 69.0, because deploying a CLWR app without a site at 69.0 or later removes the app's existing site link.

# flags.access.summary

Type of Experience Cloud site user who accesses a CLWR app.

# flags.access.description

Valid values are "authenticated" (default) and "guest". With "authenticated", the command generates the app plus the External Client Application, CORS, and MyDomain and Security settings that site users need to log in. With "guest", the command generates only the app, because guest users don't log in. Used only with --runtime CLWR.

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

# error.clwr-site-required

Specify the Experience Cloud site for this CLWR app with --site or with "site" in the definition file. Without a site, deploying the app at API version 69.0 or later removes the app's existing site link. %s

# error.clwr-site-required.version

The project's sourceApiVersion is %s.

# error.clwr-site-required.no-version

The command can't check the API version because sfdx-project.json doesn't set sourceApiVersion.

# error.clwr-site-required.invalid-version

The command can't check the API version because the project's sourceApiVersion, "%s", isn't valid.

# error.clwr-site-required.no-project

The command can't check the API version because the output directory isn't in a Salesforce DX project.

# warning.site-api-version

To deploy an app that's linked to a site, use sourceApiVersion 69.0 or later. The project's sourceApiVersion is %s, so the deploy fails. Set sourceApiVersion to 69.0 or later in sfdx-project.json, or regenerate the app without --site and link the site in Setup after you deploy.

# warning.clwr-site-later

If you later set sourceApiVersion to 69.0 or later, regenerate the app with --site before you redeploy. Otherwise, the deploy removes the app's site link.

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

# success.clwr-site-linked-guest

Deploying the app links it to the "%s" site and replaces the app's current site link, if it has one. After you deploy, in Experience Builder for the site, turn on "Allow framing of site pages on external domains", add your host domains to the site's trusted domains, make the site's /lightning-out page public, and publish the site. On your host page, set "org-url" to the site's origin without its path prefix, for example "https://example.my.site.com", and "site-prefix" to the URL path prefix, for example "/mysite", on the <lightning-out-application> tag. For a site at the root of its domain, set "site-prefix" to "". For host-page setup, see "Use Components Outside Salesforce with Lightning Out 2.0" in the Lightning Web Components Developer Guide.

# success.clwr-site-linked-authenticated

Deploying the app links it to the "%s" site and replaces the app's current site link, if it has one. After you deploy, in Experience Builder for the site, turn on "Allow framing of site pages on external domains", add your host domains to the site's trusted domains, and publish the site. On your host page, set "frontdoor-url" to the frontdoor_uri that your host app gets for the logged-in user from the site's /services/oauth2/lightningoutsingleaccess endpoint, and set "site-prefix" to the site's URL path prefix, for example "/mysite", on the <lightning-out-application> tag. For a site at the root of its domain, set "site-prefix" to "". For host-page setup, see "Use Components Outside Salesforce with Lightning Out 2.0" in the Lightning Web Components Developer Guide.

# success.clwr-site

Link the app to your Experience Cloud site after deploying. From Setup, in the Quick Find box, enter Lightning Out, and then select "Lightning Out 2.0 App Manager". Edit the app, select your site on the "Linked Communities Site" tab, and save. Then follow the steps in the "Complete Deployment in Experience Builder" dialog, which include adding your host domains to the site's trusted domains and publishing the site. Before you publish, also turn on "Allow framing of site pages on external domains" in Experience Builder, because the dialog doesn't include that step. On your host page, set the "site-prefix" attribute on the <lightning-out-application> tag to your site's URL path prefix, for example "/mysite". For a site at the root of its domain, set "site-prefix" to "". For host-page setup, see "Use Components Outside Salesforce with Lightning Out 2.0" in the Lightning Web Components Developer Guide.

# success.clwr-site-guest

For guest users, also make the site's /lightning-out page public in Experience Builder, and then publish the site again. On your host page, also set "org-url" on the <lightning-out-application> tag to the site's origin without its path prefix, for example "https://example.my.site.com".

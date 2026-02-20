## Add Template Generator to CLI

**Repo**: [salesforcecli/plugin-templates](https://github.com/salesforcecli/plugin-templates/tree/main/src/commands) (Public GitHub, requires access to `forcedotcom` org)  

### Table of Contents

- [Understanding the Two-Repo Workflow](#understanding-the-two-repo-workflow)
- [Declare your Metadata Subtopic and Create Plugin Command](#declare-your-metadata-subtopic-and-create-plugin-command-and-topic)
- [Define your CLI Input Shape](#define-your-cli-input-shape)
- [Message Labels](#message-labels)
- [Call your Template Generator](#call-your-template-generator)
- [Testing Your Command](#aw-nuts-its-time-to-test-your-new-command)
- [Release Timelines](#release-timelines)
- [Release Notes](#release-notes)
- [Local Development Guidance](#local-development-guidance)

### Understanding the Two-Repo Workflow

This guide covers adding template generators to the Salesforce CLI. It's important to understand the relationship between two repositories:

- **[salesforcedx-templates](https://github.com/forcedotcom/salesforcedx-templates)**: Contains the actual template definitions and generator logic for various metadata types
- **[plugin-templates](https://github.com/salesforcecli/plugin-templates)** (this repo): Contains the CLI commands that expose those generators to users

Creating a template generator in `salesforcedx-templates` does not immediately expose it to the CLI. It is up to each metadata owner to create a corresponding CLI command in this repo to expose their generator to users.

It's critical to remember that creating a new CLI command isn't just about getting the functionality working. You need to be very intentional about the name, description, flag names, flag types, and command names that you are using. 

**Recommended Reading: Salesforce Developer Documentation**

* [https://developer.salesforce.com/docs/platform/salesforce-cli-plugin/guide/topics.html](https://developer.salesforce.com/docs/platform/salesforce-cli-plugin/guide/topics.html)  
* [https://developer.salesforce.com/docs/platform/salesforce-cli-plugin/guide/flags.html](https://developer.salesforce.com/docs/platform/salesforce-cli-plugin/guide/flags.html)  
* [https://developer.salesforce.com/docs/platform/salesforce-cli-plugin/guide/command-flags.html](https://developer.salesforce.com/docs/platform/salesforce-cli-plugin/guide/command-flags.html)

### Declare your Metadata Subtopic and Create Plugin Command (and Topic)

1. Use `sf dev generate command -n template:generate:{metadataType}:{optionalSubTemplate} --no-unit` to bootstrap your new command.  
   1. This will create all the files you need for introducing a new command, including updating the oclif metadata  
   2. Only create a subtemplate if you want to add nested generators (e.g. `template:generate:site:brand`)   
2. Go to the [`package.json`](./package.json) and update the placeholder description for your new subtopic in the `oclif` section underneath `template > generate`  
3. (Optional) If your command is not ready to be Generally Available (GA), add a "state" to your command with `public static readonly state = 'beta|preview'`  
   1. Accepted values are `beta` or `preview` ([source](https://github.com/salesforcecli/sf-plugins-core/blob/5a4f73b05b286651ea177a6d16015ee6dafa58f7/src/sfCommand.ts#L340-L344)). Review the corresponding messages and choose which describes your command best  
      1. [beta message](https://github.com/salesforcecli/sf-plugins-core/blob/main/messages/messages.md#warningcommandinbeta)  
      2. [preview message](https://github.com/salesforcecli/sf-plugins-core/blob/main/messages/messages.md#warningcommandinpreview)  
   2. Once your generator is GA-ready, you can remove this state. Just know that if you do, you’ll be responsible for ensuring backwards compatibility for all new releases.  
4. (Optional) If you do not want your command to show up in the [command reference guide](https://developer.salesforce.com/docs/atlas.en-us.sfdx_cli_reference.meta/sfdx_cli_reference/cli_reference_unified.htm), locally when running `sf commands`, or in autocompletion results, set `public static readonly hidden = true`  
   1. NOTE: We will **not** document your command in our [weekly release notes](https://github.com/forcedotcom/cli/tree/main/releasenotes) if your command is hidden.

> If you have a single top-level metadata generator, be sure the file path to your command follows `src/commands/template/generate/{metadataType}/index.ts`

### Define your CLI Input Shape

For each new flag, the best and fastest way to get an error-proof flag added is to use the `sf dev generate flag` interactive command. 

This will walk you through the addition of a new flag and also generate all required TypeScript scaffolding as well as appending the flag to the `messages.md` file.

Each new flag is added to a `readonly` flags object, with the type, required parameter, character alias, etc… defined.

```ts
public static readonly flags = {
   name: Flags.string({ // <-- string parameter
      char: 'n', // <-- character alias
      summary: messages.getMessage('flags.name.summary'),
      description: messages.getMessage('flags.name.description'),
      required: true, // <-- CLI fails if parameter is not provided
    }),
    template: Flags.option({ // <-- string enum
      char: 't',
      summary: messages.getMessage('flags.template.summary'),
      description: messages.getMessage('flags.template.description'),
      required: true,
      options: ['RecordPage', 'AppPage', 'HomePage'] as const, // enum options
    })(), ...
}
```

### Message Labels
> Dev Hint: If you use `sf dev generate flag` for all new flags, all the scaffolding will be taken care of for you!

See the existing developer documentation for learning how to write useful messages:  
[https://developer.salesforce.com/docs/platform/salesforce-cli-plugin/guide/messages.html](https://developer.salesforce.com/docs/platform/salesforce-cli-plugin/guide/messages.html)

See [here](https://developer.salesforce.com/docs/platform/salesforce-cli-plugin/guide/messages-impl-guidelines.html) for how to implement and dynamically load your messages in your command implementation. **Each new flag requires an entry in the messages file.** 

If appropriate, link to developer.salesforce.com docs in command descriptions.

### Call your Template Generator

After defining your input contract, you’ll be able to use `runGenerator`, passing in the templateType and input options for your metadata type. This should be encapsulated inside of a `run()` method which outputs a `Promise<CreateOutput>`.

```ts
import { getCustomTemplates, runGenerator } from '../../utils/templateCommand.js';
...
public async run(): Promise<CreateOutput> {
  // ... input definition
  // pre-processing/sanitization
  return runGenerator({
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      templateType: TemplateType.[YourMetadataType],
      opts: flags,
      ux: new Ux({ jsonEnabled: this.jsonEnabled() }),
    });
}
```

### Aw NUTS\! It’s time to test your new command

If you use the `sf dev generate command` command to bootstrap your command, you’ll see that some NUTs (Not Unit Tests) are added. 

If you did not use the `generate command`, then you are expected to add your own tests. The purpose of these is to validate the integration between the CLI flags and what is ultimately passed to the generator, and to ensure that the correct files are created based on those flags.

Unless you’re in the minority, most template generators do not require a scratch org connection, so it should be fairly straightforward to create new NUTs based on the examples in the repo.

## Release Timelines

Your PR has now been merged into plugin-templates; congratulations! How long do you have to wait until it is available for consumption?

Release information is communicated through official Salesforce CLI channels.

#### Nightly

The CLI has a `nightly` release. The day after your PR is merged, you can update to the latest with `sf update nightly`. Keep in mind that if you have previously run `sf plugins link .` during development, you have to run `sf plugins unlink @salesforce/plugin-templates`.

#### Release Candidate

The release candidate branch is updated weekly, on Wednesdays, around noon CST (10am PST). To update to the release candidate, you can run `sf update latest-rc`.

After your change is merged into the `nightly` release, your team should QA/QC ahead of the promotion to the release candidate and make any necessary changes.

#### Latest 

A week after promotion to the release candidate, the RC is promoted to `latest`. Final sanity checks should be done during this week, and emergency patch fixes can be made if required. Update with `sf update latest`.

This promotion also happens around 12pm CST (10am PST) on Wednesdays.

## Release Notes

Release notes are updated weekly and merged here: [https://github.com/forcedotcom/cli/tree/main/releasenotes](https://github.com/forcedotcom/cli/tree/main/releasenotes).

If you'd like to have your new template generator command specifically included or excluded in the release notes, please coordinate with the CLI team.

## Local Development Guidance

In order to get this all to work locally, you’ll need to do a few things:

1. Ensure you’re working with `yarn 1`, not yarn 3 or 4\.  
2. If you're introducing new templates in `salesforcedx-templates`, update your `package.json` in plugin-templates to reference your local path to the root directory of `salesforcedx-templates`
3. Run `yarn build` after all changes to your templates or generator (in dx-templates)  
4. Run `yarn install --force` and `yarn build` in `plugin-templates` to fetch newly built changes from your local salesforcedx-templates directory  
5. When introducing your CLI command for the **first time**, run `sf plugins link .` from `plugin-templates`, which will override your local CLI with the new command that you’re working on.
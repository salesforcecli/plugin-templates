# plugin-templates

This repository provides a series of commands, templates, and generators for various metadata types.

[![Known Vulnerabilities](https://snyk.io/test/github/salesforcecli/plugin-templates/badge.svg)](https://snyk.io/test/github/salesforcecli/plugin-templates)
[![License](https://img.shields.io/npm/l/@salesforce/plugin-templates.svg)](https://github.com/salesforcecli/plugin-templates/blob/master/package.json)

# Getting Started

To use, install the [Salesforce CLI](https://developer.salesforce.com/tools/sfdxcli) and run the following commands.

```
Verify the CLI is installed
  $ sfdx (-v | --version)
Install the @salesforce/plugin-templates plugin
  $ sfdx plugins:install @salesforce/plugin-templates
To run a command
  $ sfdx [command]
```

## Install

1. Clone the repository, and `cd` into it.

```sh
git clone git@github.com:salesforcecli/plugin-templates.git
```

2. Ensure you have [Yarn](https://yarnpkg.com/) installed and run the following to build:

```
yarn install
yarn build
```

## Issues

Please report any issues to https://github.com/salesforcecli/plugin-templates/issues or https://github.com/forcedotcom/cli/issues.

## Contributing

1. Familiarize yourself with the codebase by reading the docs and the templates [library](https://github.com/salesforcecli/plugin-templates).
1. Create a new issue before starting your project so that we can keep track of
   what you're trying to add/fix. That way, we can also offer suggestions or
   let you know if there is already an effort in progress.
1. Fork this repository.
1. The [build](#build) section has details on how to set up your environment.
1. Create a _topic_ branch in your fork based on the correct branch (usually the **main** branch). Note: this step is recommended but technically not required if contributing using a fork.
1. Edit the code in your fork.
1. Sign CLA (see [CLA](#cla)).
1. Send us a pull request when you're done. We'll review your code, suggest any
   needed changes, and merge it in.

## Pull Requests

### Committing

1. We enforce commit message format using [commitizen](https://github.com/commitizen/cz-cli). To ensure correct formatting, use our VS Code Task `Commit`. with `yarn run commit`.
1. The commit message format that we expect is: `type: commit message`. Valid types are: feat, fix, improvement, docs, style, refactor, perf, test, build, ci, chore and revert.
1. Before commit and push, Husky runs several hooks to ensure the commit message is in the correct format and that everything lints and compiles properly.

## CLA

External contributors will be required to sign a Contributor's License
Agreement. You can do so by going to https://cla.salesforce.com/sign-cla.

# Build

## Developing Plugin

To test plugin locally, use `bin/dev` in place of `sfdx`. For example:

```sh
./bin/dev force:apex:class:create --classname 'TestClass' --template 'DefaultApexClass' --outputdir ./testsoutput/myApex/
```

Link your plugin to Salesforce CLI:

```sh
sfdx plugins:link .
```

Verify plugin is linked:

```sh
sfdx plugins
```

To test plugin locally with Salesforce CLI, add `"@salesforce/plugin-templates": "file://path/to/plugin-templates"` to the plugin's `package.json`.

## Debugging Your Plugin

We recommend using the Visual Studio Code (VS Code) IDE for your plugin development. Included in the `.vscode` directory of this plugin is a `launch.json` config file, which allows you to attach a debugger to the node process when running your commands.

To debug the `hello:org` command:

1. If you linked your plugin to the Salesforce CLI, call your command with the `dev-suspend` switch:

```sh-session
$ sfdx hello:org -u myOrg@example.com --dev-suspend
```

Alternatively, to call your command using the `bin/dev` script, set the `NODE_OPTIONS` environment variable to `--inspect-brk` when starting the debugger:

```sh-session
$ NODE_OPTIONS=--inspect-brk ./bin/dev force:apex:class:create --classname 'TestClass' --template 'DefaultApexClass' --outputdir ./testsoutput/myApex/
```

2. Set some breakpoints in your command code.
3. Click on the Debug icon in the Activity Bar on the side of VS Code to open up the Debug view.
4. In the upper left hand corner of VS Code, verify that the "Attach to Remote" launch configuration is selected.
5. Hit the green play button to the left of the "Attach to Remote" launch configuration window. The debugger should now be suspended on the first line of the program.
6. Hit the green play button at the top middle of VS Code (this play button is to the right of the play button that you clicked in step #5).

Congrats, you are debugging!

# Commands

<!-- commands -->

# Command Topics

- [`sf analytics`](docs/analytics.md) - Work with analytics assets.
- [`sf apex`](docs/apex.md)
- [`sf lightning`](docs/lightning.md) - Work with Lightning Web and Aura components.
- [`sf project`](docs/project.md) - Work with projects, such as deploy and retrieve metadata.
- [`sf static-resource`](docs/static-resource.md) - Work with static resources.
- [`sf visualforce`](docs/visualforce.md) - Work with Visualforce components.

<!-- commandsstop -->

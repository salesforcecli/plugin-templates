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

- [`sf analytics generate template`](#sf-analytics-generate-template)
- [`sf apex generate class`](#sf-apex-generate-class)
- [`sf apex generate trigger`](#sf-apex-generate-trigger)
- [`sf lightning generate app`](#sf-lightning-generate-app)
- [`sf lightning generate component`](#sf-lightning-generate-component)
- [`sf lightning generate event`](#sf-lightning-generate-event)
- [`sf lightning generate interface`](#sf-lightning-generate-interface)
- [`sf lightning generate test`](#sf-lightning-generate-test)
- [`sf project generate`](#sf-project-generate)
- [`sf static-resource generate`](#sf-static-resource-generate)
- [`sf visualforce generate component`](#sf-visualforce-generate-component)
- [`sf visualforce generate page`](#sf-visualforce-generate-page)

## `sf analytics generate template`

Generate a simple Analytics template.

```
USAGE
  $ sf analytics generate template -n <value> [--json] [--flags-dir <value>] [-d <value>] [--api-version <value>]

FLAGS
  -d, --output-dir=<value>   [default: .] Directory for saving the created files.
  -n, --name=<value>         (required) Name of the Analytics template.
      --api-version=<value>  Override the api version used for api requests made by this command

GLOBAL FLAGS
  --flags-dir=<value>  Import flag values from a directory.
  --json               Format output as json.

DESCRIPTION
  Generate a simple Analytics template.

  The metadata files associated with the Analytics template must be contained in a parent directory called
  "waveTemplates" in your package directory. Either run this command from an existing directory of this name, or use the
  --output-dir flag to generate one or point to an existing one.

ALIASES
  $ sf force analytics template create

EXAMPLES
  Generate the metadata files for a simple Analytics template file called myTemplate in the
  force-app/main/default/waveTemplates directory:

    $ sf analytics generate template --name myTemplate --output-dir force-app/main/default/waveTemplates

FLAG DESCRIPTIONS
  -d, --output-dir=<value>  Directory for saving the created files.

    The location can be an absolute path or relative to the current working directory. The default is the current
    directory.
```

_See code: [src/commands/analytics/generate/template.ts](https://github.com/salesforcecli/plugin-templates/blob/56.1.1/src/commands/analytics/generate/template.ts)_

## `sf apex generate class`

Generate an Apex class.

```
USAGE
  $ sf apex generate class -n <value> [--json] [--flags-dir <value>] [-t
    ApexException|ApexUnitTest|DefaultApexClass|InboundEmailService] [-d <value>] [--api-version <value>]

FLAGS
  -d, --output-dir=<value>   [default: .] Directory for saving the created files.
  -n, --name=<value>         (required) Name of the generated Apex class.
  -t, --template=<option>    [default: DefaultApexClass] Template to use for file creation.
                             <options: ApexException|ApexUnitTest|DefaultApexClass|InboundEmailService>
      --api-version=<value>  Override the api version used for api requests made by this command

GLOBAL FLAGS
  --flags-dir=<value>  Import flag values from a directory.
  --json               Format output as json.

DESCRIPTION
  Generate an Apex class.

  Generates the Apex *.cls file and associated metadata file. These files must be contained in a parent directory called
  "classes" in your package directory. Either run this command from an existing directory of this name, or use the
  --output-dir flag to generate one or point to an existing one.

ALIASES
  $ sf force apex class create

EXAMPLES
  Generate two metadata files associated with the MyClass Apex class (MyClass.cls and MyClass.cls-meta.xml) in the
  current directory:

    $ sf apex generate class --name MyClass

  Similar to previous example, but generates the files in the "force-app/main/default/classes" directory:

    $ sf apex generate class --name MyClass --output-dir force-app/main/default/classes

FLAG DESCRIPTIONS
  -d, --output-dir=<value>  Directory for saving the created files.

    The location can be an absolute path or relative to the current working directory. The default is the current
    directory.

  -n, --name=<value>  Name of the generated Apex class.

    The name can be up to 40 characters and must start with a letter.

  -t, --template=ApexException|ApexUnitTest|DefaultApexClass|InboundEmailService  Template to use for file creation.

    Supplied parameter values or default values are filled into a copy of the template.
```

_See code: [src/commands/apex/generate/class.ts](https://github.com/salesforcecli/plugin-templates/blob/56.1.1/src/commands/apex/generate/class.ts)_

## `sf apex generate trigger`

Generate an Apex trigger.

```
USAGE
  $ sf apex generate trigger -n <value> [--json] [--flags-dir <value>] [-t ApexTrigger] [-d <value>] [--api-version
    <value>] [-s <value>] [-e before insert|before update|before delete|after insert|after update|after delete|after
    undelete]

FLAGS
  -d, --output-dir=<value>   [default: .] Directory for saving the created files.
  -e, --event=<option>...    [default: before insert] Events that fire the trigger.
                             <options: before insert|before update|before delete|after insert|after update|after
                             delete|after undelete>
  -n, --name=<value>         (required) Name of the generated Apex trigger
  -s, --sobject=<value>      [default: SOBJECT] Salesforce object to generate a trigger on.
  -t, --template=<option>    [default: ApexTrigger] Template to use for file creation.
                             <options: ApexTrigger>
      --api-version=<value>  Override the api version used for api requests made by this command

GLOBAL FLAGS
  --flags-dir=<value>  Import flag values from a directory.
  --json               Format output as json.

DESCRIPTION
  Generate an Apex trigger.

  Generates the Apex trigger *.trigger file and associated metadata file. These files must be contained in a parent
  directory called "triggers" in your package directory. Either run this command from an existing directory of this
  name, or use the --output-dir flag to generate one or point to an existing one.

  If you don't specify the --sobject flag, the .trigger file contains the generic placeholder SOBJECT; replace it with
  the Salesforce object you want to generate a trigger for. If you don't specify --event, "before insert" is used.

ALIASES
  $ sf force apex trigger create

EXAMPLES
  Generate two files associated with the MyTrigger Apex trigger (MyTrigger.trigger and MyTrigger.trigger-meta.xml) in
  the current directory:

    $ sf apex generate trigger --name MyTrigger

  Similar to the previous example, but generate the files in the "force-app/main/default/triggers" directory:

    $ sf apex generate trigger --name MyTrigger --output-dir force-app/main/default/triggers

  Generate files for a trigger that fires on the Account object before and after an insert:

    $ sf apex generate trigger --name MyTrigger --sobject Account --event "before insert,after insert"

FLAG DESCRIPTIONS
  -d, --output-dir=<value>  Directory for saving the created files.

    The location can be an absolute path or relative to the current working directory. The default is the current
    directory.

  -n, --name=<value>  Name of the generated Apex trigger

    The name can be up to 40 characters and must start with a letter.

  -t, --template=ApexTrigger  Template to use for file creation.

    Supplied parameter values or default values are filled into a copy of the template.
```

_See code: [src/commands/apex/generate/trigger.ts](https://github.com/salesforcecli/plugin-templates/blob/56.1.1/src/commands/apex/generate/trigger.ts)_

## `sf lightning generate app`

Generate a Lightning App.

```
USAGE
  $ sf lightning generate app -n <value> [--json] [--flags-dir <value>] [-t DefaultLightningApp] [-d <value>] [--api-version
    <value>]

FLAGS
  -d, --output-dir=<value>   [default: .] Directory for saving the created files.
  -n, --name=<value>         (required) Name of the generated Lightning App.
  -t, --template=<option>    [default: DefaultLightningApp] Template to use for file creation.
                             <options: DefaultLightningApp>
      --api-version=<value>  Override the api version used for api requests made by this command

GLOBAL FLAGS
  --flags-dir=<value>  Import flag values from a directory.
  --json               Format output as json.

DESCRIPTION
  Generate a Lightning App.

  Generates a Lightning App bundle in the specified directory or the current working directory. The bundle consists of
  multiple files in a folder with the designated name.

ALIASES
  $ sf force lightning app create

EXAMPLES
  Generate the metadata files for a Lightning app bundle called "myapp" in the current directory:

    $ sf lightning generate app --name myapp

  Similar to the previous example, but generate the files in the "force-app/main/default/aura" directory:

    $ sf lightning generate app --name myapp --output-dir force-app/main/default/aura

FLAG DESCRIPTIONS
  -d, --output-dir=<value>  Directory for saving the created files.

    The location can be an absolute path or relative to the current working directory. The default is the current
    directory.

  -n, --name=<value>  Name of the generated Lightning App.

    The name can be up to 40 characters and must start with a letter.

  -t, --template=DefaultLightningApp  Template to use for file creation.

    Supplied parameter values or default values are filled into a copy of the template.
```

_See code: [src/commands/lightning/generate/app.ts](https://github.com/salesforcecli/plugin-templates/blob/56.1.1/src/commands/lightning/generate/app.ts)_

## `sf lightning generate component`

Generate a bundle for an Aura component or a Lightning web component.

```
USAGE
  $ sf lightning generate component -n <value> [--json] [--flags-dir <value>] [-t
    default|analyticsDashboard|analyticsDashboardWithStep] [-d <value>] [--api-version <value>] [--type aura|lwc]

FLAGS
  -d, --output-dir=<value>   [default: .] Directory for saving the created files.
  -n, --name=<value>         (required) Name of the generated Lightning Component.
  -t, --template=<option>    [default: default] Template to use for file creation.
                             <options: default|analyticsDashboard|analyticsDashboardWithStep>
      --api-version=<value>  Override the api version used for api requests made by this command
      --type=<option>        [default: aura] Type of the component bundle.
                             <options: aura|lwc>

GLOBAL FLAGS
  --flags-dir=<value>  Import flag values from a directory.
  --json               Format output as json.

DESCRIPTION
  Generate a bundle for an Aura component or a Lightning web component.

  Generates the bundle in the specified directory or the current working directory. The bundle consists of multiple
  files in a directory with the designated name. Lightning web components are contained in the directory with name
  "lwc", Aura components in "aura".

  To generate a Lightning web component, pass "--type lwc" to the command. If you don’t specify --type, Salesforce CLI
  generates an Aura component by default.

ALIASES
  $ sf force lightning component create

EXAMPLES
  Generate the metadata files for an Aura component bundle in the current directory:

    $ sf lightning generate component --name mycomponent

  Generate a Lightning web component bundle in the current directory:

    $ sf lightning generate component --name mycomponent --type lwc

  Generate an Aura component bundle in the "force-app/main/default/aura" directory:

    $ sf lightning generate component --name mycomponent --output-dir force-app/main/default/aura

  Generate a Lightning web component bundle in the "force-app/main/default/lwc" directory:

    $ sf lightning generate component --name mycomponent --type lwc --output-dir force-app/main/default/lwc

FLAG DESCRIPTIONS
  -d, --output-dir=<value>  Directory for saving the created files.

    The location can be an absolute path or relative to the current working directory. The default is the current
    directory.

  -n, --name=<value>  Name of the generated Lightning Component.

    The name can be up to 40 characters and must start with a letter.

  -t, --template=default|analyticsDashboard|analyticsDashboardWithStep  Template to use for file creation.

    Supplied parameter values or default values are filled into a copy of the template.
```

_See code: [src/commands/lightning/generate/component.ts](https://github.com/salesforcecli/plugin-templates/blob/56.1.1/src/commands/lightning/generate/component.ts)_

## `sf lightning generate event`

Generate a Lightning Event.

```
USAGE
  $ sf lightning generate event -n <value> [--json] [--flags-dir <value>] [-t DefaultLightningEvt] [-d <value>] [--api-version
    <value>]

FLAGS
  -d, --output-dir=<value>   [default: .] Directory for saving the created files.
  -n, --name=<value>         (required) Name of the generated Lightning Event.
  -t, --template=<option>    [default: DefaultLightningEvt] Template to use for file creation.
                             <options: DefaultLightningEvt>
      --api-version=<value>  Override the api version used for api requests made by this command

GLOBAL FLAGS
  --flags-dir=<value>  Import flag values from a directory.
  --json               Format output as json.

DESCRIPTION
  Generate a Lightning Event.

  Generates a Lightning Event bundle in the specified directory or the current working directory. The bundle consists of
  multiple files in a folder with the designated name.

ALIASES
  $ sf force lightning event create

EXAMPLES
  Generate the metadata files for a Lightning event bundle called "myevent" in the current directory:

    $ sf lightning generate event --name myevent

  Similar to previous example, but generate the files in the "force-app/main/default/aura" directory:

    $ sf lightning generate event --name myevent --output-dir force-app/main/default/aura

FLAG DESCRIPTIONS
  -d, --output-dir=<value>  Directory for saving the created files.

    The location can be an absolute path or relative to the current working directory. The default is the current
    directory.

  -n, --name=<value>  Name of the generated Lightning Event.

    The name can be up to 40 characters and must start with a letter.

  -t, --template=DefaultLightningEvt  Template to use for file creation.

    Supplied parameter values or default values are filled into a copy of the template.
```

_See code: [src/commands/lightning/generate/event.ts](https://github.com/salesforcecli/plugin-templates/blob/56.1.1/src/commands/lightning/generate/event.ts)_

## `sf lightning generate interface`

Generate a Lightning Interface.

```
USAGE
  $ sf lightning generate interface -n <value> [--json] [--flags-dir <value>] [-t DefaultLightningIntf] [-d <value>]
    [--api-version <value>]

FLAGS
  -d, --output-dir=<value>   [default: .] Directory for saving the created files.
  -n, --name=<value>         (required) Name of the generated Lightning Interface.
  -t, --template=<option>    [default: DefaultLightningIntf] Template to use for file creation.
                             <options: DefaultLightningIntf>
      --api-version=<value>  Override the api version used for api requests made by this command

GLOBAL FLAGS
  --flags-dir=<value>  Import flag values from a directory.
  --json               Format output as json.

DESCRIPTION
  Generate a Lightning Interface.

  Generates a Lightning Interface bundle in the specified directory or the current working directory. The bundle
  consists of multiple files in a folder with the designated name.

ALIASES
  $ sf force lightning interface create

EXAMPLES
  Generate the metadata files for a Lightning interface bundle called "myinterface" in the current directory:

    $ sf lightning generate interface --name myinterface

  Similar to the previous example but generate the files in the "force-app/main/default/aura" directory:

    $ sf lightning generate interface --name myinterface --output-dir force-app/main/default/aura

FLAG DESCRIPTIONS
  -d, --output-dir=<value>  Directory for saving the created files.

    The location can be an absolute path or relative to the current working directory. The default is the current
    directory.

  -n, --name=<value>  Name of the generated Lightning Interface.

    The name can be up to 40 characters and must start with a letter.

  -t, --template=DefaultLightningIntf  Template to use for file creation.

    Supplied parameter values or default values are filled into a copy of the template.
```

_See code: [src/commands/lightning/generate/interface.ts](https://github.com/salesforcecli/plugin-templates/blob/56.1.1/src/commands/lightning/generate/interface.ts)_

## `sf lightning generate test`

Generate a Lightning test.

```
USAGE
  $ sf lightning generate test -n <value> [--json] [--flags-dir <value>] [-t DefaultLightningTest] [-d <value>]
    [--api-version <value>]

FLAGS
  -d, --output-dir=<value>   [default: .] Directory for saving the created files.
  -n, --name=<value>         (required) Name of the generated Lightning Test.
  -t, --template=<option>    [default: DefaultLightningTest] Template to use for file creation.
                             <options: DefaultLightningTest>
      --api-version=<value>  Override the api version used for api requests made by this command

GLOBAL FLAGS
  --flags-dir=<value>  Import flag values from a directory.
  --json               Format output as json.

DESCRIPTION
  Generate a Lightning test.

  Generates the test in the specified directory or the current working directory. The .resource file and associated
  metadata file are generated.

ALIASES
  $ sf force lightning test create

EXAMPLES
  Generate the metadata files for the Lightning test called MyLightningTest in the current directory:

    $ sf lightning generate test --name MyLightningTest

  Similar to the previous example but generate the files in the "force-app/main/default/lightningTests" directory:

    $ sf lightning generate test --name MyLightningTest --output-dir force-app/main/default/lightningTests

FLAG DESCRIPTIONS
  -d, --output-dir=<value>  Directory for saving the created files.

    The location can be an absolute path or relative to the current working directory. The default is the current
    directory.

  -n, --name=<value>  Name of the generated Lightning Test.

    Name of the new Lightning test; can be up to 40 characters and must start with a letter.

  -t, --template=DefaultLightningTest  Template to use for file creation.

    Supplied parameter values or default values are filled into a copy of the template.
```

_See code: [src/commands/lightning/generate/test.ts](https://github.com/salesforcecli/plugin-templates/blob/56.1.1/src/commands/lightning/generate/test.ts)_

## `sf project generate`

Generate a Salesforce DX project.

```
USAGE
  $ sf project generate -n <value> [--json] [--flags-dir <value>] [-t standard|empty|analytics] [-d <value>] [-s
    <value>] [-p <value>] [-x] [--api-version <value>]

FLAGS
  -d, --output-dir=<value>           [default: .] Directory for saving the created files.
  -n, --name=<value>                 (required) Name of the generated project.
  -p, --default-package-dir=<value>  [default: force-app] Default package directory name.
  -s, --namespace=<value>            Namespace associated with this project and any connected scratch orgs.
  -t, --template=<option>            [default: standard] Template to use for project creation.
                                     <options: standard|empty|analytics>
  -x, --manifest                     Generate a manifest (package.xml) for change-set based development.
      --api-version=<value>          Will set this version as sourceApiVersion in the sfdx-project.json file

GLOBAL FLAGS
  --flags-dir=<value>  Import flag values from a directory.
  --json               Format output as json.

DESCRIPTION
  Generate a Salesforce DX project.

  A Salesforce DX project has a specific structure and a configuration file (sfdx-project.json) that identifies the
  directory as a Salesforce DX project. This command generates the necessary configuration files and directories to get
  you started.

  By default, the generated sfdx-project.json file sets the sourceApiVersion property to the default API version
  currently used by Salesforce CLI. To specify a different version, set the apiVersion configuration variable. For
  example: "sf config set apiVersion=57.0 --global".

ALIASES
  $ sf force project create

EXAMPLES
  Generate a project called "mywork":

    $ sf project generate --name mywork

  Similar to previous example, but generate the files in a directory called "myapp":

    $ sf project generate --name mywork --default-package-dir myapp

  Similar to prevoius example, but also generate a default package.xml manifest file:

    $ sf project generate --name mywork --default-package-dir myapp --manifest

  Generate a project with the minimum files and directories:

    $ sf project generate --name mywork --template empty

FLAG DESCRIPTIONS
  -d, --output-dir=<value>  Directory for saving the created files.

    The location can be an absolute path or relative to the current working directory. The default is the current
    directory.

  -n, --name=<value>  Name of the generated project.

    Generates a project directory with this name; any valid directory name is accepted. Also sets the "name" property in
    the sfdx-project.json file to this name.

  -p, --default-package-dir=<value>  Default package directory name.

    Metadata items such as classes and Lightning bundles are placed inside this folder.

  -t, --template=standard|empty|analytics  Template to use for project creation.

    The template determines the sample configuration files and directories that this command generates. For example, the
    empty template provides these files and directory to get you started.

    - .forceignore
    - config/project-scratch-def.json
    - sfdx-project.json
    - package.json
    - force-app (basic source directory structure)

    The standard template provides a complete force-app directory structure so you know where to put your source. It
    also provides additional files and scripts, especially useful when using Salesforce Extensions for VS Code. For
    example:

    - .gitignore: Use Git for version control.
    - .prettierrc and .prettierignore: Use Prettier to format your Aura components.
    - .vscode/extensions.json: When launched, Visual Studio Code, prompts you to install the recommended extensions for
    your project.
    - .vscode/launch.json: Configures Replay Debugger.
    - .vscode/settings.json: Additional configuration settings.

    The analytics template provides similar files and the force-app/main/default/waveTemplates directory.

  -x, --manifest  Generate a manifest (package.xml) for change-set based development.

    Generates a default manifest (package.xml) for fetching Apex, Visualforce, Lightning components, and static
    resources.

  --api-version=<value>  Will set this version as sourceApiVersion in the sfdx-project.json file

    Override the api version used for api requests made by this command
```

_See code: [src/commands/project/generate.ts](https://github.com/salesforcecli/plugin-templates/blob/56.1.1/src/commands/project/generate.ts)_

## `sf static-resource generate`

Generate a static resource.

```
USAGE
  $ sf static-resource generate -n <value> [--json] [--flags-dir <value>] [--type <value>] [-d <value>] [--api-version
  <value>]

FLAGS
  -d, --output-dir=<value>   [default: .] Directory for saving the created files.
  -n, --name=<value>         (required) Name of the generated static resource.
      --api-version=<value>  Override the api version used for api requests made by this command
      --type=<value>         [default: application/zip] Content type (mime type) of the generated static resource.

GLOBAL FLAGS
  --flags-dir=<value>  Import flag values from a directory.
  --json               Format output as json.

DESCRIPTION
  Generate a static resource.

  Generates the metadata resource file in the specified directory or the current working directory. Static resource
  files must be contained in a parent directory called "staticresources" in your package directory. Either run this
  command from an existing directory of this name, or use the --output-dir flag to create one or point to an existing
  one.

ALIASES
  $ sf force staticresource create

EXAMPLES
  Generate the metadata file for a static resource called MyResource in the current directory:

    $ sf static-resource generate --name MyResource

  Similar to previous example, but specifies a MIME type of application/json:

    $ sf static-resource generate --name MyResource --type application/json

  Generate the resource file in the "force-app/main/default/staticresources" directory:

    $ sf static-resource generate --name MyResource --output-dir force-app/main/default/staticresources

FLAG DESCRIPTIONS
  -d, --output-dir=<value>  Directory for saving the created files.

    The location can be an absolute path or relative to the current working directory. The default is the current
    directory.

  -n, --name=<value>  Name of the generated static resource.

    This name can contain only underscores and alphanumeric characters, and must be unique in your org. It must begin
    with a letter, not include spaces, not end with an underscore, and not contain two consecutive underscores.

  --type=<value>  Content type (mime type) of the generated static resource.

    Must be a valid MIME type such as application/json, application/javascript, application/zip, text/plain, text/css,
    etc.
```

_See code: [src/commands/static-resource/generate.ts](https://github.com/salesforcecli/plugin-templates/blob/56.1.1/src/commands/static-resource/generate.ts)_

## `sf visualforce generate component`

Generate a Visualforce Component.

```
USAGE
  $ sf visualforce generate component -n <value> -l <value> [--json] [--flags-dir <value>] [-t DefaultVFComponent] [-d <value>]
    [--api-version <value>]

FLAGS
  -d, --output-dir=<value>   [default: .] Directory for saving the created files.
  -l, --label=<value>        (required) Visualforce Component label.
  -n, --name=<value>         (required) Name of the generated Visualforce Component.
  -t, --template=<option>    [default: DefaultVFComponent] Template to use for file creation.
                             <options: DefaultVFComponent>
      --api-version=<value>  Override the api version used for api requests made by this command

GLOBAL FLAGS
  --flags-dir=<value>  Import flag values from a directory.
  --json               Format output as json.

DESCRIPTION
  Generate a Visualforce Component.

  The command generates the .Component file and associated metadata file in the specified directory or the current
  working directory by default.

ALIASES
  $ sf force visualforce component create

EXAMPLES
  Generate the metadata files for a Visualforce component in the current directory:

    $ sf visualforce generate component --name mycomponent --label mylabel

  Similar to previous example, but generate the files in the directory "force-app/main/default/components":

    $ sf visualforce generate component --name mycomponent --label mylabel --output-dir components

FLAG DESCRIPTIONS
  -d, --output-dir=<value>  Directory for saving the created files.

    The location can be an absolute path or relative to the current working directory. The default is the current
    directory.

  -n, --name=<value>  Name of the generated Visualforce Component.

    The name can be up to 40 characters and must start with a letter.

  -t, --template=DefaultVFComponent  Template to use for file creation.

    Supplied parameter values or default values are filled into a copy of the template.
```

_See code: [src/commands/visualforce/generate/component.ts](https://github.com/salesforcecli/plugin-templates/blob/56.1.1/src/commands/visualforce/generate/component.ts)_

## `sf visualforce generate page`

Generate a Visualforce Page.

```
USAGE
  $ sf visualforce generate page -n <value> -l <value> [--json] [--flags-dir <value>] [-d <value>] [--api-version
  <value>]

FLAGS
  -d, --output-dir=<value>   [default: .] Directory for saving the created files.
  -l, --label=<value>        (required) Visualforce Page label.
  -n, --name=<value>         (required) Name of the generated Visualforce Page.
      --api-version=<value>  Override the api version used for api requests made by this command

GLOBAL FLAGS
  --flags-dir=<value>  Import flag values from a directory.
  --json               Format output as json.

DESCRIPTION
  Generate a Visualforce Page.

  The command generates the .Page file and associated metadata file in the specified directory or the current working
  directory by default.

ALIASES
  $ sf force visualforce page create

EXAMPLES
  Generate the metadata files for a Visualforce page in the current directory:

    $ sf visualforce generate page --name mypage --label mylabel

  Similar to previous example, but generate the files in the directory "force-app/main/default/pages":

    $ sf visualforce generate page --name mypage --label mylabel --output-dir pages

FLAG DESCRIPTIONS
  -d, --output-dir=<value>  Directory for saving the created files.

    The location can be an absolute path or relative to the current working directory. The default is the current
    directory.

  -n, --name=<value>  Name of the generated Visualforce Page.

    The name can be up to 40 characters and must start with a letter.
```

_See code: [src/commands/visualforce/generate/page.ts](https://github.com/salesforcecli/plugin-templates/blob/56.1.1/src/commands/visualforce/generate/page.ts)_

<!-- commandsstop -->

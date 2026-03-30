# summary

Generate a UI bundle, which contains the code and metadata to build a UI experience that uses non-native Salesforce frameworks, such as React.

# description

Salesforce provides native UI frameworks, such as Lighting Web Components (LWC), to build applications on Salesforce Platform. But you can also use other non-native UI frameworks, such as the open-source React framework, to build a UI experience that also runs on the Salesforce Platform and that you can launch from the App Launcher.

These non-native UI frameworks are defined in your DX project with the "UIBundle" metadata type. Use this command to generate the required structure and files. For example, when you run this command and specify the name MyUiBundle, then the files are generated into a "uiBundles/MyUiBundle" directory. Use the --output-dir flag to specify a different directory.

Use the --template flag to generate files for getting started with a speciic UI framework, such as React. Check out the README.md file in the generated "uiBundles/<bundlename>" directory for more information about a specific template.

# examples

- Generate a UI bundle called MyUiBundle in the current directory:

  <%= config.bin %> <%= command.id %> --name MyUiBundle

- Generate a React-based UI bundle:

  <%= config.bin %> <%= command.id %> --name MyReactApp --template reactbasic

- Generate the React-based UI bundle in the "force-app/main/default/uiBundles" directory:

  <%= config.bin %> <%= command.id %> --name MyUiBundle --template reactbasic --output-dir force-app/main/default/uiBundles

# flags.name.summary

API name of the generated UI bundle.

# flags.name.description

This name can contain only underscores and alphanumeric characters, and must be unique in your org. It must begin with a letter, not include spaces, not end with an underscore, and not contain two consecutive underscores.

# flags.template.summary

Template to use when creating the files for a specific UI framework.

# flags.template.description

Supplied parameter values or default values are filled into a copy of the template.

# flags.label.summary

Master label for the UI bundle.

# flags.label.description

If not specified, the label is derived from the name.

# flags.output-dir.summary

Directory into which the files are created.

# flags.output-dir.description

The location can be an absolute path or relative to the current working directory.

If not specified, the command reads your sfdx-project.json and defaults to "uiBundles" directory within your default package directory. When running outside a Salesforce DX project, defaults to the current directory.

**Important:** This command automatically ensures the output directory ends with "uiBundles". If your specified path doesn't end with "uiBundles", it's automatically appended. The UI bundle is created at "<output-dir>/<name>".

**Examples:**

- "--output-dir force-app/main/default" → Creates a UI bundle at "force-app/main/default/uiBundles/MyUiBundle/"
- "--output-dir force-app/main/default/uiBundles" → Creates a UI bundle at "force-app/main/default/uiBundles/MyUiBundle/" (no change)

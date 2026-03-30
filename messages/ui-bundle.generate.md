# summary

Generate a UI bundle.

# description

Generates a UI bundle in the specified directory or the current working directory. The UI bundle files are created in a folder with the designated name. UI bundle files must be contained in a parent directory called "uiBundles" in your package directory. Either run this command from an existing directory of this name, or use the --output-dir flag to create one or point to an existing one.

# examples

- Generate a UI bundle called MyUiBundle in the current directory:

  <%= config.bin %> <%= command.id %> --name MyUiBundle

- Generate a React-based UI bundle:

  <%= config.bin %> <%= command.id %> --name MyReactApp --template reactbasic

- Generate the UI bundle in the "force-app/main/default/uiBundles" directory:

  <%= config.bin %> <%= command.id %> --name MyUiBundle --output-dir force-app/main/default/uiBundles

# flags.name.summary

Name of the generated UI bundle.

# flags.name.description

This name can contain only underscores and alphanumeric characters, and must be unique in your org. It must begin with a letter, not include spaces, not end with an underscore, and not contain two consecutive underscores.

# flags.template.summary

Template to use for file creation.

# flags.template.description

Supplied parameter values or default values are filled into a copy of the template.

# flags.label.summary

Master label for the UI bundle.

# flags.label.description

If not specified, the label is derived from the name.

# flags.output-dir.summary

Directory for saving the created files.

# flags.output-dir.description

The location can be an absolute path or relative to the current working directory.

**Important:** The generator automatically ensures the output directory ends with "uiBundles". If your specified path doesn't end with "uiBundles", it's automatically appended. The UI bundle is created at "<output-dir>/<name>".

**Examples:**

- "--output-dir force-app/main/default" → Creates a UI bundle at "force-app/main/default/uiBundles/MyUiBundle/"
- "--output-dir force-app/main/default/uiBundles" → Creates a UI bundle at "force-app/main/default/uiBundles/MyUiBundle/" (no change)

If not specified, the command reads your sfdx-project.json and defaults to "uiBundles" directory within your default package directory. When running outside a Salesforce DX project, defaults to the current directory.

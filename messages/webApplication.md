# summary

Generate a web application.

# description

Generates a web application in the specified directory or the current working directory. The web application files are created in a folder with the designated name. Web application files must be contained in a parent directory called "webApplications" in your package directory. Either run this command from an existing directory of this name, or use the --output-dir flag to create one or point to an existing one.

# examples

- Generate a web application called MyWebApp in the current directory:

  <%= config.bin %> <%= command.id %> --name MyWebApp

- Generate a React-based web application:

  <%= config.bin %> <%= command.id %> --name MyReactApp --template reactbasic

- Generate the web application in the "force-app/main/default/webApplications" directory:

  <%= config.bin %> <%= command.id %> --name MyWebApp --output-dir force-app/main/default/webApplications

# flags.name.summary

Name of the generated web application.

# flags.name.description

This name can contain only underscores and alphanumeric characters, and must be unique in your org. It must begin with a letter, not include spaces, not end with an underscore, and not contain two consecutive underscores.

# flags.template.summary

Template to use for file creation.

# flags.template.description

Supplied parameter values or default values are filled into a copy of the template.

# flags.label.summary

Master label for the web application.

# flags.label.description

If not specified, the label is derived from the name.

# flags.output-dir.summary

Directory for saving the created files.

# flags.output-dir.description

The location can be an absolute path or relative to the current working directory. If not specified, the command reads your sfdx-project.json and defaults to the webApplications directory within your default package directory. When running outside a Salesforce DX project, defaults to the current directory.

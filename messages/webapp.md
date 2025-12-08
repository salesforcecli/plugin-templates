# summary

Create a web app and associated metadata.

# description

This command creates a new web app with the specified configuration, including the basic structure and metadata files. The web app files are created in a "webApplications" directory under the specified output directory.

# examples

- Create a web app in the current directory:

  <%= config.bin %> <%= command.id %> --name "myWebApp" --label "My first Web App"

- Create a web app with a specific template:

  <%= config.bin %> <%= command.id %> --name "myWebApp" --label "My Web App" --template lwc-basic

- Create a web app in a specific directory:

  <%= config.bin %> <%= command.id %> --name "myWebApp" --label "My Web App" --output-dir force-app/main/default

# flags.name.summary

Name of your web app.

# flags.name.description

The name used to identify your web app in the project.

# flags.label.summary

Human readable name of your web app.

# flags.label.description

The display name for your web app that users will see.

# flags.template.summary

Template to use for web app generation.

# flags.template.description

Specify a template to scaffold your web app with pre-configured files and structure.

# flags.output-dir.summary

Directory for saving the created files.

# flags.output-dir.description

The location can be an absolute path or relative to the current working directory. The default is the current directory.

# flags.force.summary

Overwrite existing files.

# flags.force.description

If the web app directory already exists, overwrite it with the new template files.

# error.directoryExists

Directory '%s' already exists.

# error.directoryExists.action

Use --force to overwrite the existing directory.

# error.cloneFailed

Failed to download template: %s

# error.cloneFailed.action

Check your network connection and try again. If the problem persists, report an issue.

# info.removingDirectory

Removing existing directory: %s

# info.success

Your web app has been created.

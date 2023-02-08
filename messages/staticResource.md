# summary

Generate a static resource.

# description

Generates the metadata resource file in the specified directory or the current working directory. Static resource files must be contained in a parent directory called "staticresources" in your package directory. Either run this command from an existing directory of this name, or use the --output-dir flag to create one or point to an existing one.

# examples

- Generate the metadata file for a static resource called MyResource in the current directory:

  <%= config.bin %> <%= command.id %> --name MyResource

- Similar to previous example, but specifies a MIME type of application/json:

  <%= config.bin %> <%= command.id %> --name MyResource --type application/json

- Generate the resource file in the "force-app/main/default/staticresources" directory:

  <%= config.bin %> <%= command.id %> --name MyResource --output-dir force-app/main/default/staticresources

# flags.name.summary

Name of the generated static resource.

# flags.name.description

This name can contain only underscores and alphanumeric characters, and must be unique in your org. It must begin with a letter, not include spaces, not end with an underscore, and not contain two consecutive underscores.

# flags.type.summary

Content type (mime type) of the generated static resource.

# flags.type.description

Must be a valid MIME type such as application/json, application/javascript, application/zip, text/plain, text/css, etc.

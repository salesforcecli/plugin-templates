# summary

create a static resource

# description

Creates a static resource in the specified directory or the current working directory. The resource folder and associated metadata file are created.

# examples

- $ <%= config.bin %> <%= command.id %> -n MyResource
- $ <%= config.bin %> <%= command.id %> -n MyResource --type application/json
- $ <%= config.bin %> <%= command.id %> -n MyResource -d staticresources

# flags.name.summary

name of the generated static resource

# flags.name.description

The name of the new static resource. This name can contain only underscores and alphanumeric characters, and must be unique in your org. It must begin with a letter, not include spaces, not end with an underscore, and not contain two consecutive underscores.

# flags.type.summary

content type (mime type) of the generated static resource

# flags.type.description

The content type of the generated static resource. This must be a valid MIME type such as application/json, application/javascript, application/zip, text/plain, text/css, etc.

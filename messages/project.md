# summary

create a Salesforce DX project

# description

Creates a Salesforce DX project in the specified directory or the current working directory. The command creates the necessary configuration files and folders.

# examples

- $ <%= config.bin %> <%= command.id %> --name mywork
- $ <%= config.bin %> <%= command.id %> --name mywork --default-package-dir myapp
- $ <%= config.bin %> <%= command.id %> --name mywork --default-package-dir myapp --manifest
- $ <%= config.bin %> <%= command.id %> --name mywork --template empty

# flags.name

name of the generated project

# flags.name.description

The name for the new project. Any valid folder name is accepted.

# flags.template

template to use for project creation

# flags.template.description

The template to use to create the project. Supplied parameter values or default values are filled into a copy of the template.

# flags.namespace

project associated namespace

# flags.namespace.description

The namespace associated with this project and any connected scratch orgs.

# flags.packagedir

default package directory name

# flags.packagedir.description

The default package directory name. Metadata items such as classes and Lightning bundles are placed inside this folder.

# flags.manifest

generate a manifest (package.xml) for change-set based development

# flags.manifest.description

Generates a default manifest (package.xml) for fetching Apex, Visualforce, Lightning components, and static resources.

# flags.loginurl

Salesforce instance login URL

# flags.loginurl.description

The login URL for the Salesforce instance being used. Normally defaults to https://login.salesforce.com.

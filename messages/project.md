# summary

Generate a Salesforce DX project.

# description

A Salesforce DX project has a specific structure and a configuration file (sfdx-project.json) that identifies the directory as a Salesforce DX project. This command generates the necessary configuration files and directories to get you started.

By default, the generated sfdx-project.json file sets the sourceApiVersion property to the default API version currently used by Salesforce CLI. To specify a different version, set the apiVersion configuration variable. For example: "sf config set apiVersion=57.0 --global".

# examples

- Generate a project called "mywork":

  <%= config.bin %> <%= command.id %> --name mywork

- Similar to previous example, but generate the files in a directory called "myapp":

  <%= config.bin %> <%= command.id %> --name mywork --default-package-dir myapp

- Similar to prevoius example, but also generate a default package.xml manifest file:

  <%= config.bin %> <%= command.id %> --name mywork --default-package-dir myapp --manifest

- Generate a project with the minimum files and directories:

  <%= config.bin %> <%= command.id %> --name mywork --template empty

# flags.name.summary

Name of the generated project.

# flags.name.description

Generates a project directory with this name; any valid directory name is accepted. Also sets the "name" property in the sfdx-project.json file to this name.

# flags.template.summary

Template to use for project creation.

# flags.template.description

The template determines the sample configuration files and directories that this command generates. For example, the empty template provides these files and directory to get you started.

- .forceignore
- config/project-scratch-def.json
- sfdx-project.json
- package.json
- force-app (basic source directory structure)

The standard template provides a complete force-app directory structure so you know where to put your source. It also provides additional files and scripts, especially useful when using Salesforce Extensions for VS Code. For example:

- .gitignore: Use Git for version control.
- .prettierrc and .prettierignore: Use Prettier to format your Aura components.
- .vscode/extensions.json: When launched, Visual Studio Code, prompts you to install the recommended extensions for your project.
- .vscode/launch.json: Configures Replay Debugger.
- .vscode/settings.json: Additional configuration settings.

The analytics template provides similar files and the force-app/main/default/waveTemplates directory.

# flags.namespace.summary

Namespace associated with this project and any connected scratch orgs.

# flags.api-version.summary

Will set this version as sourceApiVersion in the sfdx-project.json file

# flags.default-package-dir.summary

Default package directory name.

# flags.default-package-dir.description

Metadata items such as classes and Lightning bundles are placed inside this folder.

# flags.manifest.summary

Generate a manifest (package.xml) for change-set based development.

# flags.manifest.description

Generates a default manifest (package.xml) for fetching Apex, Visualforce, Lightning components, and static resources.

# flags.login-url.summary

Salesforce instance login URL.

# flags.login-url.description

Normally defaults to https://login.salesforce.com.

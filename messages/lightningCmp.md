# examples

- Generate the metadata files for an Aura component bundle in the current directory:

  <%= config.bin %> <%= command.id %> --name mycomponent

- Generate a Lightning web component bundle in the current directory:

  <%= config.bin %> <%= command.id %> --name mycomponent --type lwc

- Generate an Aura component bundle in the "force-app/main/default/aura" directory:

  <%= config.bin %> <%= command.id %> --name mycomponent --output-dir force-app/main/default/aura

- Generate a Lightning web component bundle in the "force-app/main/default/lwc" directory:

  <%= config.bin %> <%= command.id %> --name mycomponent --type lwc --output-dir force-app/main/default/lwc

# summary

Generate a bundle for an Aura component or a Lightning web component.

# description

Generates the bundle in the specified directory or the current working directory. The bundle consists of multiple files in a directory with the designated name. Lightning web components are contained in the directory with name "lwc", Aura components in "aura".

To generate a Lightning web component, pass "--type lwc" to the command. If you don’t specify --type, Salesforce CLI generates an Aura component by default.

# flags.type.summary

Type of the component bundle.

# examples

- Create the metadata files for an Aura component bundle in the current directory:

  <%= config.bin %> <%= command.id %> --name mycomponent

- Create a Lightning web component bundle in the current directory:

  <%= config.bin %> <%= command.id %> --name mycomponent --type lwc

- Create an Aura component bundle in the "force-app/main/default/aura" directory:

  <%= config.bin %> <%= command.id %> --name mycomponent --output-dir force-app/main/default/aura

- Create a Lightning web component bundle in the "force-app/main/default/lwc" directory:

  <%= config.bin %> <%= command.id %> --name mycomponent --type lwc --output-dir force-app/main/default/lwc

# summary

Create a bundle for an Aura component or a Lightning web component.

# description

Creates the bundle in the specified directory or the current working directory. The bundle consists of multiple files in a directory with the designated name.  Lightning web components are contained in the directory with name "lwc", Aura components in "aura".

To create a Lightning web component, pass "--type lwc" to the command. If you don’t specify --type, Salesforce CLI creates an Aura component by default.

# flags.type

Type of the component bundle.

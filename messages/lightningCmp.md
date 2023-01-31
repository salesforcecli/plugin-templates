# examples

- $ <%= config.bin %> <%= command.id %> -n mycomponent

- $ <%= config.bin %> <%= command.id %> -n mycomponent --type lwc

- $ <%= config.bin %> <%= command.id %> -n mycomponent -d aura

- $ <%= config.bin %> <%= command.id %> -n mycomponent --type lwc -d lwc

# summary

create a bundle for an Aura component or a Lightning web component

# description

Creates a bundle for an Aura component or a Lightning web component in the specified directory or the current working directory. The bundle consists of multiple files in a folder with the designated name.

To create a Lightning web component, pass --type lwc to the command. If you don’t include a --type value, Salesforce CLI creates an Aura component by default.

# flags.type

type of the Lightning component

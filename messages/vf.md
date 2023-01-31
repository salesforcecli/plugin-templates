# summary

create a Visualforce %s

# description

Creates a Visualforce %s in the specified directory or the current working directory. The command creates the .%s file and associated metadata file.

# flags.name

name of the generated Visualforce %s

# flags.name.description

The Visualforce %s name. The name can be up to 40 characters and must start with a letter.

# flags.label

Visualforce %s label

# examples.component

- $ <%= config.bin %> <%= command.id %> -n mycomponent -l mylabel
- $ <%= config.bin %> <%= command.id %> -n mycomponent -l mylabel -d components

# examples.page

- $ <%= config.bin %> <%= command.id %> -n mypage -l mylabel
- $ <%= config.bin %> <%= command.id %> -n mypage -l mylabel -d pages

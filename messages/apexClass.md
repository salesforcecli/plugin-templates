# summary

create an Apex class

# description

Creates an Apex class in the specified directory or the current working directory. If you don’t explicitly set the API version, it defaults to the current API version. The .cls file and associated metadata file are created.

# flags.name.summary

name of the generated Apex class

# flags.name.description

The name of the new Apex class. The name can be up to 40 characters and must start with a letter.

# examples

- $ <%= config.bin %> <%= command.id %> -n MyClass
- $ <%= config.bin %> <%= command.id %> -n MyClass -d classes

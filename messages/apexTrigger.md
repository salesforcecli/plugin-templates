# summary

create an Apex trigger

# description

Creates an Apex trigger in the specified directory or the current working directory. If you don’t explicitly set the API version, it defaults to the current API version. The .trigger file and associated metadata file are created.

# flags.event

events that fire the trigger

# flags.name

name of the generated Apex trigger

# flags.name.description

The name of the new Apex trigger. The name can be up to 40 characters and must start with a letter.

# flags.sobject

sObject to create a trigger on

# examples

- $ <%= config.bin %> <%= command.id %> -n MyTrigger
- $ <%= config.bin %> <%= command.id %> -n MyTrigger -s Account -e before insert,after insert",
- $ <%= config.bin %> <%= command.id %> -n MyTrigger -d triggers,

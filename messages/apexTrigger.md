# summary

Generate an Apex trigger.

# description

Generates the Apex trigger *.trigger file and associated metadata file. These files must be contained in a parent directory called "triggers" in your package directory. Either run this command from an existing directory of this name, or use the --output-dir flag to generate one or point to an existing one.

If you don't specify the --sobject flag, the .trigger file contains the generic placeholder SOBJECT; replace it with the Salesforce object you want to generate a trigger for. If you don't specify --event, "before insert" is used.

# flags.event.summary

Events that fire the trigger.

# flags.name.summary

Name of the generated Apex trigger

# flags.name.description

The name can be up to 40 characters and must start with a letter.

# flags.sobject.summary

Salesforce object to generate a trigger on.

# examples

- Generate two files associated with the MyTrigger Apex trigger (MyTrigger.trigger and MyTrigger.trigger-meta.xml) in the current directory:

  <%= config.bin %> <%= command.id %> --name MyTrigger

- Similar to the previous example, but generate the files in the "force-app/main/default/triggers" directory:

  <%= config.bin %> <%= command.id %> --name MyTrigger --output-dir force-app/main/default/triggers

- Generate files for a trigger that fires on the Account object before and after an insert:

  <%= config.bin %> <%= command.id %> --name MyTrigger --sobject Account --event "before insert,after insert"

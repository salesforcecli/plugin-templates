# summary

Generate an Apex class.

# description

Generates the Apex *.cls file and associated metadata file. These files must be contained in a parent directory called "classes" in your package directory. Either run this command from an existing directory of this name, or use the --output-dir flag to generate one or point to an existing one. 

# flags.name.summary

Name of the generated Apex class.

# flags.name.description

The name can be up to 40 characters and must start with a letter.

# examples

- Generate two metadata files associated with the MyClass Apex class (MyClass.cls and MyClass.cls-meta.xml) in the current directory:

  <%= config.bin %> <%= command.id %> --name MyClass

- Similar to previous example, but generates the files in the "force-app/main/default/classes" directory:

  <%= config.bin %> <%= command.id %> --name MyClass --output-dir force-app/main/default/classes

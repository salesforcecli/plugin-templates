# examples

- Generate the metadata files for the Lightning test called MyLightningTest in the current directory:

  <%= config.bin %> <%= command.id %> --name MyLightningTest

- Similar to the previous example but generate the files in the "force-app/main/default/lightningTests" directory:

  <%= config.bin %> <%= command.id %> --name MyLightningTest --output-dir force-app/main/default/lightningTests

# summary

Generate a Lightning test.

# description

Generates the test in the specified directory or the current working directory. The .resource file and associated metadata file are generated.

# flags.name.description

Name of the new Lightning test; can be up to 40 characters and must start with a letter.

# summary

Generate a simple Analytics template. 

# description

The metadata files associated with the Analytics template must be contained in a parent directory called "waveTemplates" in your package directory. Either run this command from an existing directory of this name, or use the --output-dir flag to generate one or point to an existing one. 

# flags.name.summary

Name of the Analytics template.

# examples

- Generate the metadata files for a simple Analytics template file called myTemplate in the force-app/main/default/waveTemplates directory:

  <%= config.bin %> <%= command.id %> --name myTemplate --output-dir force-app/main/default/waveTemplates

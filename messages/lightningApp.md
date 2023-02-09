# examples

- Generate the metadata files for a Lightning app bundle called "myapp" in the current directory:

  <%= config.bin %> <%= command.id %> --name myapp

- Similar to the previous example, but generate the files in the "force-app/main/default/aura" directory:

  <%= config.bin %> <%= command.id %> --name myapp --output-dir force-app/main/default/aura

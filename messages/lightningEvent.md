# examples

- Generate the metadata files for a Lightning event bundle called "myevent" in the current directory:

  <%= config.bin %> <%= command.id %> --name myevent
 
- Similar to previous example, but generate the files in the "force-app/main/default/aura" directory:

  <%= config.bin %> <%= command.id %> --name myevent --output-dir force-app/main/default/aura

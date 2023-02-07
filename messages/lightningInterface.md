# examples

- Create the metadata files for a Lightning interface bundle called "myinterface" in the current directory:

  <%= config.bin %> <%= command.id %> --name myinterface

- Similar to the previous example but create the files in the "force-app/main/default/aura" directory:

  <%= config.bin %> <%= command.id %> --name myinterface --output-dir force-app/main/default/aura

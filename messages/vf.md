# summary

Generate a Visualforce %s.

# description

The command generates the .%s file and associated metadata file in the specified directory or the current working directory by default.

# flags.name.summary

Name of the generated Visualforce %s.

# flags.name.description

The name can be up to 40 characters and must start with a letter.

# flags.label.summary

Visualforce %s label.

# examples.component

- Generate the metadata files for a Visualforce component in the current directory:

  <%= config.bin %> <%= command.id %> --name mycomponent --label mylabel

- Similar to previous example, but generate the files in the directory "force-app/main/default/components":

  <%= config.bin %> <%= command.id %> --name mycomponent --label mylabel --output-dir components

# examples.page

- Generate the metadata files for a Visualforce page in the current directory:

  <%= config.bin %> <%= command.id %> --name mypage --label mylabel

- Similar to previous example, but generate the files in the directory "force-app/main/default/pages":

  <%= config.bin %> <%= command.id %> --name mypage --label mylabel --output-dir pages

# summary

Generate a Lightning Web Runtime (LWR) Build Your Own Experience Site.

# description

Creates an LWR Build Your Own Experience Site with the specified name and URL path prefix. The site includes all necessary metadata files including DigitalExperienceConfig, DigitalExperienceBundle, Network, and CustomSite.

# examples

- Generate an LWR BYO site named "mysite" with URL path prefix "mysite":

  <%= config.bin %> <%= command.id %> --name mysite --url-path-prefix mysite

- Generate an LWR BYO site with a custom output directory:

  <%= config.bin %> <%= command.id %> --name mysite --url-path-prefix mysite --output-dir force-app/main/default

# flags.name.summary

Name of the site to generate.

# flags.name.description

The name of the site.

# flags.url-path-prefix.summary

URL path prefix for the site.

# flags.url-path-prefix.description

Optional. The URL path prefix for the site. This is used in the site's URL. Must contain only alphanumeric characters.

# flags.output-dir.summary

Directory to generate the site files in.

# flags.output-dir.description

The location can be an absolute path or relative to the current working directory. If not specified, the command reads your sfdx-project.json and uses the default package directory. When running outside a Salesforce DX project, defaults to the current directory.

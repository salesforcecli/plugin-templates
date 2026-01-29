# summary

Generate an Experience Cloud site.

# description

Creates an Experience Cloud site with the specified template, name and URL path prefix. The site includes all necessary metadata files including DigitalExperienceConfig, DigitalExperienceBundle, Network, and CustomSite.

# examples

- Generate a BYO LWR site named "mysite" with URL path prefix "mysite":

  <%= config.bin %> <%= command.id %> --template build_your_own_lwr --name mysite --url-path-prefix mysite

- Generate a BYO LWR site with a custom output directory:

  <%= config.bin %> <%= command.id %> --template build_your_own_lwr --name mysite --url-path-prefix mysite --output-dir force-app/main/default

# flags.name.summary

Name of the site to generate.

# flags.template.summary

Template to use for site generation.

# flags.template.description

Supported templates:

- build_your_own_lwr - <https://help.salesforce.com/s/articleView?id=experience.rss_build_your_own_lwr.htm>

# flags.url-path-prefix.summary

URL path prefix for the site; must contain only alphanumeric characters.

# flags.admin-email.summary

Email address for the site administrator. This will default to the username of the currently authenticated user.

# flags.output-dir.summary

Directory to generate the site files in.

# flags.output-dir.description

The location can be an absolute path or relative to the current working directory. If not specified, the command reads your sfdx-project.json and uses the default package directory. When running outside a Salesforce DX project, defaults to the current directory.

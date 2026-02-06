# summary

Generate an Experience Cloud site.

# description

Creates an Experience Cloud site with the specified template, name, and URL path prefix. The site includes all necessary metadata files, including DigitalExperienceConfig, DigitalExperienceBundle, Network, and CustomSite.

# examples

- Generate an Experience Cloud site using the BuildYourOwnLWR template. The site is called "mysite" and has the URL path prefix "mysite":

  <%= config.bin %> <%= command.id %> --template BuildYourOwnLWR --name mysite --url-path-prefix mysite

- Generate an Experience Cloud site like the last example, but generate the files into the specified output directory: 

  <%= config.bin %> <%= command.id %> --template BuildYourOwnLWR --name mysite --url-path-prefix mysite --output-dir force-app/main/default

# flags.name.summary

Name of the Experience Cloud site to generate.

# flags.template.summary

Template to use when generating the site.

# flags.template.description

Supported templates:

- BuildYourOwnLWR - Creates blazing-fast digital experiences, such as websites, microsites, and portals, using the Lightning Web Components programming model. Powered by Lightning Web Runtime (LWR), this customizable template delivers unparalleled site performance.  For additional details, see this Salesforce Help topic: https://help.salesforce.com/s/articleView?id=experience.rss_build_your_own_lwr.htm. 

# flags.url-path-prefix.summary

URL path prefix for the site; must contain only alphanumeric characters.

# flags.admin-email.summary

Email address for the site administrator. Defaults to the username of the currently authenticated user.

# flags.output-dir.summary

Directory to generate the site files in.

# flags.output-dir.description

The location can be an absolute path or relative to the current working directory. If not specified, the command reads your sfdx-project.json file and uses the default package directory. When running outside a Salesforce DX project, defaults to the current directory.

# examples

- Generate an embedding wrapper LWC in the current directory:

  <%= config.bin %> <%= command.id %> --name MyEmbeddingWrapper --src https://app.example.com --sandbox allow-forms --shell-title "Expense Report Embedding"

- Generate an embedding wrapper LWC in the "force-app/main/default/lwc" directory with multiple sandbox tokens:

  <%= config.bin %> <%= command.id %> --name MyEmbeddingWrapper --src https://app.example.com --sandbox allow-forms --sandbox allow-scripts --shell-title "Expense Report Embedding" --output-dir force-app/main/default/lwc

# summary

Generate a Lightning Web Component (LWC) bundle that wraps the <lightning-ui-embedding> base component.

# description

The generated LWC bundle consumes the first-party <lightning-ui-embedding> component, which is pre-wired with the three required attributes: the embedding URL (src), iframe sandbox tokens, and an accessible iframe title (shell-title).

The generated LWC bundle contains four files (.html, .js, .js-meta.xml, .css) in a directory named with the camelCased component name. The bundle must live under a parent folder named "lwc".

# flags.name.summary

Name of the generated component; must be in PascalCase format.

# flags.name.description

The component name is also used (camelCased) as the LWC folder name and file stem. Must contain only alphanumeric characters and start with a letter.

# flags.src.summary

Absolute HTTPS URL that the iframe will load.

# flags.src.description

The URL is bound to the <lightning-ui-embedding> "src" attribute as a reactive property in the generated LWC. Must use HTTPS; plain HTTP is allowed only for localhost or 127.0.0.1 (for local development).

# flags.src.error

The --src flag must be an absolute HTTPS URL, such as https://app.example.com. Plain HTTP is allowed only for localhost or 127.0.0.1.

# flags.sandbox.summary

Iframe sandbox token. Specify this flag multiple times to set more than one token.

# flags.sandbox.description

Each token is written into the space-separated "sandbox" attribute on <lightning-ui-embedding>. Only W3C-defined sandbox tokens are accepted.

# flags.shell-title.summary

Accessible title for the embedded iframe.

# flags.shell-title.description

Written to the "shell-title" attribute on <lightning-ui-embedding> and used as the iframe's accessible name (announced by screen readers).

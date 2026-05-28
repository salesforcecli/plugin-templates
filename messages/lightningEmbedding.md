# examples

- Generate an embedding wrapper LWC in the current directory:

  <%= config.bin %> <%= command.id %> --name MyEmbeddingWrapper --src https://app.example.com --sandbox allow-forms --shell-title "Expense Report Widget"

- Generate an embedding wrapper LWC in the "force-app/main/default/lwc" directory with multiple sandbox tokens:

  <%= config.bin %> <%= command.id %> --name MyEmbeddingWrapper --src https://app.example.com --sandbox allow-forms --sandbox allow-scripts --shell-title "Expense Report Widget" --output-dir force-app/main/default/lwc

# summary

Generate a Lightning Web Component that wraps the lightning-embedding base component.

# description

Generates a Lightning Web Component bundle that consumes the first-party <lightning-embedding> component, pre-wired with the three required attributes: the widget URL (src), iframe sandbox tokens, and an accessible iframe title (shell-title).

The generated bundle contains four files (.html, .js, .js-meta.xml, .css) in a directory named with the camelCased component name. The bundle must live under a parent folder named "lwc".

# flags.name.summary

PascalCase name of the generated component.

# flags.name.description

The component name is also used (camelCased) as the LWC folder name and file stem. Must contain only alphanumeric characters and start with a letter.

# flags.src.summary

Absolute https URL the iframe will load.

# flags.src.description

The URL is bound to the <lightning-embedding> "src" attribute as a reactive property in the generated LWC. Must use https; plain http is only allowed for localhost or 127.0.0.1 (for local development).

# flags.src.error

The --src flag must be an absolute https URL (e.g., https://app.example.com). Plain http is only allowed for localhost or 127.0.0.1.

# flags.sandbox.summary

Iframe sandbox token (specify the flag multiple times to set more than one token).

# flags.sandbox.description

Each token is written into the space-separated "sandbox" attribute on <lightning-embedding>. Only W3C-defined sandbox tokens are accepted.

# flags.shell-title.summary

Accessible title for the embedded iframe.

# flags.shell-title.description

Written to the "shell-title" attribute on <lightning-embedding> and used as the iframe's accessible name (announced by screen readers).

# examples

- Generate a RecordPage FlexiPage for the Account object in the current directory:

  <%= config.bin %> <%= command.id %> --name Account_Record_Page --template RecordPage --sobject Account

- Generate an AppPage FlexiPage in the "force-app/main/default/flexipages" directory:

  <%= config.bin %> <%= command.id %> --name Sales_Dashboard --template AppPage --output-dir force-app/main/default/flexipages

- Generate a HomePage FlexiPage with a custom label:

  <%= config.bin %> <%= command.id %> --name Custom_Home --template HomePage --label "Sales Home Page"

- Generate a RecordPage with dynamic highlights and detail fields:

  <%= config.bin %> <%= command.id %> --name Property_Page --template RecordPage --sobject Rental_Property**c --primary-field Name --secondary-fields Property_Address**c,City**c --detail-fields Name,Property_Address**c,City**c,Monthly_Rent**c,Bedrooms\_\_c

# summary

Generate a FlexiPage, also known as a Lightning page.

# description

FlexiPages are the metadata types associated with a Lightning page. A Lightning page represents a customizable screen made up of regions containing Lightning components.

You can use this command to generate these types of FlexiPages; specify the type with the --template flag:

- AppPage: A Lightning page used as the home page for a custom app or a standalone application page.
- HomePage: A Lightning page used to override the Home page in Lightning Experience.
- RecordPage: A Lightning page used to override an object record page in Lightning Experience. Requires that you specify the object name with the --sobject flag.

# flags.name.summary

Name of the FlexiPage.

# flags.name.description

The name can contain only alphanumeric characters, must start with a letter, and can't end with an underscore or contain two consecutive underscores.

# flags.template.summary

Template type for the FlexiPage.

# flags.label.summary

Label of this FlexiPage; if not specified, uses the FlexiPage name as the label.

# flags.description.summary

Description for the FlexiPage, which provides context about its purpose.

# flags.sobject.summary

API name of the Salesforce object; required when creating a RecordPage.

# flags.sobject.description

For RecordPage FlexiPages, you must specify the associated object API name, such as 'Account', 'Opportunity', or 'Custom_Object\_\_c'. This sets the `sobjectType` field in the FlexiPage metadata.

# flags.primary-field.summary

Primary field for dynamic highlights (RecordPage only).

# flags.primary-field.description

The single field API name to display as the primary field in the dynamic highlights component. Typically 'Name'.

# flags.secondary-fields.summary

Secondary field(s) for dynamic highlights (RecordPage only).

# flags.secondary-fields.description

Comma-separated list of field API names to display as secondary fields in the dynamic highlights component. These are additional key fields shown in the header.

# flags.detail-fields.summary

Field(s) to display in the Details tab field section (RecordPage only).

# flags.detail-fields.description

Comma-separated list of field API names to display in the Details tab field section. These fields appear in the main content area of the record page.

# errors.recordPageRequiresSobject

RecordPage template requires the --sobject flag to specify the Salesforce object API name (e.g., 'Account', 'Opportunity', 'Custom_Object\_\_c').

# errors.tooManySecondaryFields

Too many secondary fields specified (%s). The Dynamic Highlights Panel supports a maximum of %s secondary fields.

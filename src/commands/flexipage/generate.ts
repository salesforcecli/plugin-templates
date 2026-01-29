/*
 * Copyright (c) 2019, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import { Flags, loglevel, orgApiVersionFlagWithDeprecations, SfCommand, Ux } from '@salesforce/sf-plugins-core';
import { CreateOutput, FlexipageOptions, TemplateType } from '@salesforce/templates';
import { Messages } from '@salesforce/core';
import { getCustomTemplates, runGenerator } from '../../utils/templateCommand.js';
import { internalFlag, outputDirFlag } from '../../utils/flags.js';

Messages.importMessagesDirectoryFromMetaUrl(import.meta.url);
const messages = Messages.loadMessages('@salesforce/plugin-templates', 'flexipage');

export default class FlexipageGenerate extends SfCommand<CreateOutput> {
  public static readonly summary = messages.getMessage('summary');
  public static readonly description = messages.getMessage('description');
  public static readonly examples = messages.getMessages('examples');
  public static readonly aliases = ['force:flexipage:create'];
  public static readonly deprecateAliases = true;
  public static readonly flags = {
    name: Flags.string({
      char: 'n',
      summary: messages.getMessage('flags.name.summary'),
      description: messages.getMessage('flags.name.description'),
      required: true,
      aliases: ['flexipagename'],
      deprecateAliases: true,
    }),
    template: Flags.option({
      char: 't',
      summary: messages.getMessage('flags.template.summary'),
      required: true,
      options: ['RecordPage', 'AppPage', 'HomePage'] as const,
    })(),
    'output-dir': outputDirFlag,
    'api-version': orgApiVersionFlagWithDeprecations,
    label: Flags.string({
      summary: messages.getMessage('flags.label.summary'),
      aliases: ['masterlabel'],
      deprecateAliases: true,
    }),
    description: Flags.string({
      summary: messages.getMessage('flags.description.summary'),
    }),
    sobject: Flags.string({
      char: 's',
      summary: messages.getMessage('flags.sobject.summary'),
      description: messages.getMessage('flags.sobject.description'),
      aliases: ['entity-name', 'entity'],
      deprecateAliases: true,
    }),
    'primary-field': Flags.string({
      summary: messages.getMessage('flags.primary-field.summary'),
      description: messages.getMessage('flags.primary-field.description'),
    }),
    'secondary-fields': Flags.string({
      summary: messages.getMessage('flags.secondary-fields.summary'),
      description: messages.getMessage('flags.secondary-fields.description'),
      multiple: true,
      delimiter: ',',
    }),
    'detail-fields': Flags.string({
      summary: messages.getMessage('flags.detail-fields.summary'),
      description: messages.getMessage('flags.detail-fields.description'),
      multiple: true,
      delimiter: ',',
    }),
    internal: internalFlag,
    loglevel,
  };

  public async run(): Promise<CreateOutput> {
    const { flags } = await this.parse(FlexipageGenerate);

    // Validate RecordPage requires sobject
    if (flags.template === 'RecordPage' && !flags.sobject) {
      throw new Error(messages.getMessage('errors.recordPageRequiresSobject'));
    }

    // Convert CLI flags to library options
    const flagsAsOptions: FlexipageOptions = {
      flexipagename: flags.name,
      template: flags.template,
      outputdir: flags['output-dir'],
      apiversion: flags['api-version'],
      masterlabel: flags.label,
      description: flags.description,
      entityName: flags.sobject,
      primaryField: flags['primary-field'],
      secondaryFields: flags['secondary-fields'] ?? [],
      detailFields: flags['detail-fields'] ?? [],
      internal: flags.internal,
    };

    return runGenerator({
      templateType: TemplateType.Flexipage,
      opts: flagsAsOptions,
      ux: new Ux({ jsonEnabled: this.jsonEnabled() }),
      templates: getCustomTemplates(this.configAggregator),
    });
  }
}

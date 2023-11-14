/*
 * Copyright (c) 2019, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Flags, loglevel, orgApiVersionFlagWithDeprecations, SfCommand, Ux } from '@salesforce/sf-plugins-core';
import { Messages } from '@salesforce/core';
import AnalyticsTemplateGenerator from '@salesforce/templates/lib/generators/analyticsTemplateGenerator.js';
import { AnalyticsTemplateOptions, CreateOutput } from '@salesforce/templates';
import { getCustomTemplates, runGenerator } from '../../../utils/templateCommand.js';
import { outputDirFlag } from '../../../utils/flags.js';

Messages.importMessagesDirectory(dirname(fileURLToPath(import.meta.url)));
const messages = Messages.loadMessages('@salesforce/plugin-templates', 'analyticsTemplate');
export default class AnalyticsTemplate extends SfCommand<CreateOutput> {
  public static readonly examples = messages.getMessages('examples');
  public static readonly summary = messages.getMessage('summary');
  public static readonly description = messages.getMessage('description');
  public static readonly aliases = ['force:analytics:template:create'];
  public static readonly deprecateAliases = true;
  public static readonly flags = {
    'output-dir': outputDirFlag,
    'api-version': orgApiVersionFlagWithDeprecations,
    name: Flags.string({
      char: 'n',
      summary: messages.getMessage('flags.name.summary'),
      required: true,
      aliases: ['templatename'],
      deprecateAliases: true,
    }),
    loglevel,
  };

  public async run(): Promise<CreateOutput> {
    const { flags } = await this.parse(AnalyticsTemplate);
    const flagsAsOptions: AnalyticsTemplateOptions = {
      apiversion: flags['api-version'],
      templatename: flags.name,
      outputdir: flags['output-dir'],
    };

    return runGenerator({
      generator: AnalyticsTemplateGenerator,
      opts: flagsAsOptions,
      ux: new Ux({ jsonEnabled: this.jsonEnabled() }),
      templates: getCustomTemplates(this.configAggregator),
    });
  }
}

/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { Flags, loglevel, orgApiVersionFlagWithDeprecations, SfCommand, Ux } from '@salesforce/sf-plugins-core';
import { CreateOutput, StaticResourceOptions } from '@salesforce/templates';
import StaticResourceGenerator from '@salesforce/templates/lib/generators/staticResourceGenerator';
import { Messages } from '@salesforce/core';
import { outputDirFlag } from '../../utils/flags';
import { getCustomTemplates, runGenerator } from '../../utils/templateCommand';

Messages.importMessagesDirectory(__dirname);
const messages = Messages.loadMessages('@salesforce/plugin-templates', 'staticResource');
export default class StaticResource extends SfCommand<CreateOutput> {
  public static readonly summary = messages.getMessage('summary');
  public static readonly description = messages.getMessage('description');
  public static readonly examples = messages.getMessages('examples');
  public static readonly aliases = ['force:staticresource:create'];
  public static readonly deprecateAliases = true;
  public static readonly flags = {
    name: Flags.string({
      char: 'n',
      summary: messages.getMessage('flags.name.summary'),
      description: messages.getMessage('flags.name.description'),
      required: true,
      aliases: ['resourcename'],
      deprecateAliases: true,
    }),
    type: Flags.string({
      summary: messages.getMessage('flags.type.summary'),
      description: messages.getMessage('flags.type.description'),
      default: 'application/zip',
      aliases: ['contenttype'],
      deprecateAliases: true,
    }),
    'output-dir': outputDirFlag,
    'api-version': orgApiVersionFlagWithDeprecations,
    loglevel,
  };

  public async run(): Promise<CreateOutput> {
    const { flags } = await this.parse(StaticResource);
    // translate the new flags to the old ones the generator expects
    const flagsAsOptions: StaticResourceOptions = {
      resourcename: flags.name,
      contenttype: flags.type,
      template: 'empty',
      outputdir: flags['output-dir'],
      apiversion: flags['api-version'],
    };

    return runGenerator({
      generator: StaticResourceGenerator,
      opts: flagsAsOptions,
      ux: new Ux({ jsonEnabled: this.jsonEnabled() }),
      templates: getCustomTemplates(this.configAggregator),
    });
  }
}

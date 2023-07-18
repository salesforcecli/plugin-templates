/*
 * Copyright (c) 2019, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {
  arrayWithDeprecation,
  Flags,
  loglevel,
  orgApiVersionFlagWithDeprecations,
  SfCommand,
  Ux,
} from '@salesforce/sf-plugins-core';
import { ApexTriggerOptions, CreateOutput } from '@salesforce/templates';
import ApexTriggerGenerator from '@salesforce/templates/lib/generators/apexTriggerGenerator';
import { CreateUtil } from '@salesforce/templates/lib/utils';
import { Messages } from '@salesforce/core';
import { getCustomTemplates, runGenerator } from '../../../utils/templateCommand';
import { outputDirFlag } from '../../../utils/flags';

Messages.importMessagesDirectory(__dirname);
const apexTriggerFileSuffix = /.trigger$/;
const commonMessages = Messages.loadMessages('@salesforce/plugin-templates', 'messages');
const messages = Messages.loadMessages('@salesforce/plugin-templates', 'apexTrigger');
export default class ApexTrigger extends SfCommand<CreateOutput> {
  public static readonly summary = messages.getMessage('summary');
  public static readonly description = messages.getMessage('description');
  public static readonly examples = messages.getMessages('examples');
  public static readonly aliases = ['force:apex:trigger:create'];
  public static readonly deprecateAliases = true;
  public static readonly flags = {
    name: Flags.string({
      char: 'n',
      summary: messages.getMessage('flags.name.summary'),
      description: messages.getMessage('flags.name.description'),
      required: true,
      aliases: ['triggername'],
      deprecateAliases: true,
    }),
    template: Flags.string({
      char: 't',
      summary: commonMessages.getMessage('flags.template.summary'),
      description: commonMessages.getMessage('flags.template.description'),
      default: 'ApexTrigger',
      options: CreateUtil.getCommandTemplatesForFiletype(apexTriggerFileSuffix, 'apextrigger'),
    }),
    'output-dir': outputDirFlag,
    'api-version': orgApiVersionFlagWithDeprecations,
    sobject: Flags.string({
      char: 's',
      summary: messages.getMessage('flags.sobject.summary'),
      default: 'SOBJECT',
    }),
    event: arrayWithDeprecation({
      char: 'e',
      aliases: ['triggerevents'],
      deprecateAliases: true,
      summary: messages.getMessage('flags.event.summary'),
      default: ['before insert'],
      options: [
        'before insert',
        'before update',
        'before delete',
        'after insert',
        'after update',
        'after delete',
        'after undelete',
      ] as ApexTriggerOptions['triggerevents'],
    }),
    loglevel,
  };

  public async run(): Promise<CreateOutput> {
    const { flags } = await this.parse(ApexTrigger);
    return runGenerator({
      generator: ApexTriggerGenerator,
      opts: {
        triggername: flags.name,
        outputdir: flags['output-dir'],
        template: 'ApexTrigger',
        sobject: flags.sobject,
        triggerevents: flags.event as ApexTriggerOptions['triggerevents'],
      },
      ux: new Ux({ jsonEnabled: this.jsonEnabled() }),
      templates: getCustomTemplates(this.configAggregator),
    });
  }
}

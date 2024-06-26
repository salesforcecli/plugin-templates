/*
 * Copyright (c) 2019, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import { Flags, loglevel, orgApiVersionFlagWithDeprecations, SfCommand, Ux } from '@salesforce/sf-plugins-core';
import { ApexClassOptions, CreateOutput, TemplateType } from '@salesforce/templates';
import { CreateUtil } from '@salesforce/templates/lib/utils/index.js';
import { Messages } from '@salesforce/core';
import { runGenerator, getCustomTemplates } from '../../../utils/templateCommand.js';
import { outputDirFlag } from '../../../utils/flags.js';

Messages.importMessagesDirectoryFromMetaUrl(import.meta.url);
const messages = Messages.loadMessages('@salesforce/plugin-templates', 'apexClass');
const commonMessages = Messages.loadMessages('@salesforce/plugin-templates', 'messages');
const apexClassFileSuffix = /.cls$/;

export default class ApexClass extends SfCommand<CreateOutput> {
  public static readonly summary = messages.getMessage('summary');
  public static readonly description = messages.getMessage('description');
  public static readonly examples = messages.getMessages('examples');
  public static readonly aliases = ['force:apex:class:create'];
  public static readonly deprecateAliases = true;
  public static readonly flags = {
    name: Flags.string({
      char: 'n',
      summary: messages.getMessage('flags.name.summary'),
      description: messages.getMessage('flags.name.description'),
      required: true,
      aliases: ['classname'],
      deprecateAliases: true,
    }),
    template: Flags.string({
      char: 't',
      summary: commonMessages.getMessage('flags.template.summary'),
      description: commonMessages.getMessage('flags.template.description'),
      default: 'DefaultApexClass',
      options: CreateUtil.getCommandTemplatesForFiletype(apexClassFileSuffix, 'apexclass'),
    }),
    'output-dir': outputDirFlag,
    'api-version': orgApiVersionFlagWithDeprecations,
    loglevel,
  };

  public async run(): Promise<CreateOutput> {
    const { flags } = await this.parse(ApexClass);
    const flagsAsOptions: ApexClassOptions = {
      apiversion: flags['api-version'],
      classname: flags.name,
      template: flags.template as ApexClassOptions['template'],
      outputdir: flags['output-dir'],
    };
    return runGenerator({
      templateType: TemplateType.ApexClass,
      opts: flagsAsOptions,
      ux: new Ux({ jsonEnabled: this.jsonEnabled() }),
      templates: getCustomTemplates(this.configAggregator),
    });
  }
}

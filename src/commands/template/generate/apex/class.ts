/*
 * Copyright 2025, Salesforce, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { Flags, loglevel, orgApiVersionFlagWithDeprecations, SfCommand, Ux } from '@salesforce/sf-plugins-core';
import { ApexClassOptions, CreateOutput, CreateUtil, TemplateType } from '@salesforce/templates';
import { Messages } from '@salesforce/core';
import { runGenerator, getCustomTemplates } from '../../../../utils/templateCommand.js';
import { outputDirFlag } from '../../../../utils/flags.js';

Messages.importMessagesDirectoryFromMetaUrl(import.meta.url);
const messages = Messages.loadMessages('@salesforce/plugin-templates', 'apexClass');
const commonMessages = Messages.loadMessages('@salesforce/plugin-templates', 'messages');
const apexClassFileSuffix = /.cls$/;

export default class ApexClass extends SfCommand<CreateOutput> {
  public static readonly summary = messages.getMessage('summary');
  public static readonly description = messages.getMessage('description');
  public static readonly examples = messages.getMessages('examples');
  public static readonly aliases = ['force:apex:class:create', 'apex:generate:class'];
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

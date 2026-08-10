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
import { CreateOutput, CreateUtil, TemplateType, VisualforcePageOptions } from '@salesforce/templates';
import { Messages } from '@salesforce/core';
import { getCustomTemplates, runGenerator } from '../../../../utils/templateCommand.js';
import { outputDirFlag } from '../../../../utils/flags.js';
const visualforcePageFileSuffix = /.page$/;
const VF_TYPE = 'Page';

Messages.importMessagesDirectoryFromMetaUrl(import.meta.url);
const commonMessages = Messages.loadMessages('@salesforce/plugin-templates', 'messages');
const messages = Messages.loadMessages('@salesforce/plugin-templates', 'vf');
export default class VisualforcePage extends SfCommand<CreateOutput> {
  public static readonly summary = messages.getMessage('summary', [VF_TYPE]);
  public static readonly description = messages.getMessage('description', [VF_TYPE]);
  public static readonly examples = messages.getMessages('examples.page');
  public static readonly aliases = ['force:visualforce:page:create', 'visualforce:generate:page'];
  public static readonly deprecateAliases = true;
  public static readonly flags = {
    name: Flags.string({
      char: 'n',
      summary: messages.getMessage('flags.name.summary', [VF_TYPE]),
      description: messages.getMessage('flags.name.description'),
      required: true,
      aliases: ['pagename'],
      deprecateAliases: true,
    }),
    // there is only one valid template in the interface for VisualforcePageOptions
    template: Flags.string({
      char: 't',
      summary: commonMessages.getMessage('flags.template.summary'),
      description: commonMessages.getMessage('flags.template.description'),
      default: 'DefaultVFPage',
      hidden: true,
      options: CreateUtil.getCommandTemplatesForFiletype(visualforcePageFileSuffix, 'visualforcepage'),
    }),
    'output-dir': outputDirFlag,

    'api-version': orgApiVersionFlagWithDeprecations,
    label: Flags.string({
      char: 'l',
      summary: messages.getMessage('flags.label.summary', [VF_TYPE]),
      required: true,
    }),
    loglevel,
  };

  public async run(): Promise<CreateOutput> {
    const { flags } = await this.parse(VisualforcePage);

    // translate the new flags to the old ones the generator expects
    const flagsAsOptions: VisualforcePageOptions = {
      pagename: flags.name,
      label: flags.label,
      template: 'DefaultVFPage',
      outputdir: flags['output-dir'],
      apiversion: flags['api-version'],
    };
    return runGenerator({
      templateType: TemplateType.VisualforcePage,
      opts: flagsAsOptions,
      ux: new Ux({ jsonEnabled: this.jsonEnabled() }),
      templates: getCustomTemplates(this.configAggregator),
    });
  }
}

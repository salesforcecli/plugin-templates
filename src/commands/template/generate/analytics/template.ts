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
import { Messages } from '@salesforce/core';
import { AnalyticsTemplateOptions, CreateOutput, TemplateType } from '@salesforce/templates';
import { getCustomTemplates, runGenerator } from '../../../../utils/templateCommand.js';
import { outputDirFlag } from '../../../../utils/flags.js';

Messages.importMessagesDirectoryFromMetaUrl(import.meta.url);
const messages = Messages.loadMessages('@salesforce/plugin-templates', 'analyticsTemplate');
export default class AnalyticsTemplate extends SfCommand<CreateOutput> {
  public static readonly examples = messages.getMessages('examples');
  public static readonly summary = messages.getMessage('summary');
  public static readonly description = messages.getMessage('description');
  public static readonly aliases = ['force:analytics:template:create', 'analytics generate template'];
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
      templateType: TemplateType.AnalyticsTemplate,
      opts: flagsAsOptions,
      ux: new Ux({ jsonEnabled: this.jsonEnabled() }),
      templates: getCustomTemplates(this.configAggregator),
    });
  }
}

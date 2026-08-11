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

import { Flags, loglevel, SfCommand, orgApiVersionFlagWithDeprecations, Ux } from '@salesforce/sf-plugins-core';
import { CreateOutput, CreateUtil, LightningTestOptions, TemplateType } from '@salesforce/templates';
import { Messages } from '@salesforce/core';
import { getCustomTemplates, runGenerator } from '../../../../utils/templateCommand.js';
import { internalFlag, outputDirFlagLightning } from '../../../../utils/flags.js';
const lightningTestFileSuffix = /.resource$/;

Messages.importMessagesDirectoryFromMetaUrl(import.meta.url);
const messages = Messages.loadMessages('@salesforce/plugin-templates', 'lightningTest');
const lightningMessages = Messages.loadMessages('@salesforce/plugin-templates', 'lightning');
export default class LightningTest extends SfCommand<CreateOutput> {
  public static readonly summary = messages.getMessage('summary');
  public static readonly description = messages.getMessage('description');
  public static readonly examples = messages.getMessages('examples');
  public static readonly aliases = ['force:lightning:test:create', 'lightning:generate:test'];
  public static readonly deprecateAliases = true;
  public static readonly flags = {
    name: Flags.string({
      char: 'n',
      summary: lightningMessages.getMessage('flags.name.summary', ['Test']),
      description: messages.getMessage('flags.name.description'),
      required: true,
      aliases: ['testname'],
      deprecateAliases: true,
    }),
    template: Flags.string({
      char: 't',
      summary: lightningMessages.getMessage('flags.template.summary'),
      description: lightningMessages.getMessage('flags.template.description'),
      default: 'DefaultLightningTest',
      options: CreateUtil.getCommandTemplatesForFiletype(lightningTestFileSuffix, 'lightningtest'),
    }),
    'output-dir': outputDirFlagLightning,
    internal: internalFlag,
    'api-version': orgApiVersionFlagWithDeprecations,
    loglevel,
  };

  public async run(): Promise<CreateOutput> {
    const { flags } = await this.parse(LightningTest);

    // translate the new flags to the old ones the generator expects
    const flagsAsOptions: LightningTestOptions = {
      testname: flags.name,
      template: 'DefaultLightningTest',
      outputdir: flags['output-dir'],
      internal: flags.internal,
      apiversion: flags['api-version'],
    };
    return runGenerator({
      templateType: TemplateType.LightningTest,
      opts: flagsAsOptions,
      ux: new Ux({ jsonEnabled: this.jsonEnabled() }),
      templates: getCustomTemplates(this.configAggregator),
    });
  }
}

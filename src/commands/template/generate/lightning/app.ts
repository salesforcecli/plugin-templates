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
import { CreateOutput, CreateUtil, LightningAppOptions, TemplateType } from '@salesforce/templates';
import { Messages } from '@salesforce/core';
import { getCustomTemplates, runGenerator } from '../../../../utils/templateCommand.js';
import { internalFlag, outputDirFlagLightning } from '../../../../utils/flags.js';

Messages.importMessagesDirectoryFromMetaUrl(import.meta.url);
const lightningCommonMessages = Messages.loadMessages('@salesforce/plugin-templates', 'lightning');
const lightningAppMessages = Messages.loadMessages('@salesforce/plugin-templates', 'lightningApp');
const lightningAppFileSuffix = /.app$/;
const BUNDLE_TYPE = 'App';

export default class LightningApp extends SfCommand<CreateOutput> {
  public static readonly summary = lightningCommonMessages.getMessage('summary', [BUNDLE_TYPE]);
  public static readonly description = lightningCommonMessages.getMessage('description', [BUNDLE_TYPE]);
  public static readonly examples = lightningAppMessages.getMessages('examples');
  public static readonly aliases = ['force:lightning:app:create', 'lightning:generate:app'];
  public static readonly deprecateAliases = true;
  public static readonly flags = {
    name: Flags.string({
      char: 'n',
      summary: lightningCommonMessages.getMessage('flags.name.summary', [BUNDLE_TYPE]),
      description: lightningCommonMessages.getMessage('flags.name.description'),
      required: true,
      aliases: ['appname'],
      deprecateAliases: true,
    }),
    template: Flags.string({
      char: 't',
      summary: lightningCommonMessages.getMessage('flags.template.summary'),
      description: lightningCommonMessages.getMessage('flags.template.description'),
      default: 'DefaultLightningApp',
      options: CreateUtil.getCommandTemplatesForFiletype(lightningAppFileSuffix, 'lightningapp'),
    }),
    'output-dir': outputDirFlagLightning,
    'api-version': orgApiVersionFlagWithDeprecations,
    internal: internalFlag,
    loglevel,
  };

  public async run(): Promise<CreateOutput> {
    const { flags } = await this.parse(LightningApp);
    const flagsAsOptions: LightningAppOptions = {
      appname: flags.name,
      apiversion: flags['api-version'],
      outputdir: flags['output-dir'],
      template: 'DefaultLightningApp',
      internal: flags.internal,
    };
    return runGenerator({
      templateType: TemplateType.LightningApp,
      opts: flagsAsOptions,
      ux: new Ux({ jsonEnabled: this.jsonEnabled() }),
      templates: getCustomTemplates(this.configAggregator),
    });
  }
}

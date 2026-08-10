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
import { CreateOutput, CreateUtil, LightningInterfaceOptions, TemplateType } from '@salesforce/templates';
import { Messages } from '@salesforce/core';
import { getCustomTemplates, runGenerator } from '../../../../utils/templateCommand.js';
import { internalFlag, outputDirFlagLightning } from '../../../../utils/flags.js';
const lightningInterfaceFileSuffix = /.intf$/;
const BUNDLE_TYPE = 'Interface';

Messages.importMessagesDirectoryFromMetaUrl(import.meta.url);
const messages = Messages.loadMessages('@salesforce/plugin-templates', 'lightningInterface');
const lightningCommon = Messages.loadMessages('@salesforce/plugin-templates', 'lightning');

export default class LightningInterface extends SfCommand<CreateOutput> {
  public static readonly summary = lightningCommon.getMessage('summary', [BUNDLE_TYPE]);
  public static readonly description = lightningCommon.getMessage('description', [BUNDLE_TYPE]);
  public static readonly examples = messages.getMessages('examples');
  public static readonly aliases = ['force:lightning:interface:create', 'lightning:generate:interface'];
  public static readonly deprecateAliases = true;
  public static readonly flags = {
    name: Flags.string({
      char: 'n',
      summary: lightningCommon.getMessage('flags.name.summary', [BUNDLE_TYPE]),
      description: lightningCommon.getMessage('flags.name.description'),
      required: true,
      aliases: ['interfacename'],
      deprecateAliases: true,
    }),
    template: Flags.string({
      char: 't',
      summary: lightningCommon.getMessage('flags.template.summary'),
      description: lightningCommon.getMessage('flags.template.description'),
      default: 'DefaultLightningIntf',
      options: CreateUtil.getCommandTemplatesForFiletype(lightningInterfaceFileSuffix, 'lightninginterface'),
    }),
    'output-dir': outputDirFlagLightning,
    'api-version': orgApiVersionFlagWithDeprecations,
    internal: internalFlag,
    loglevel,
  };

  public async run(): Promise<CreateOutput> {
    const { flags } = await this.parse(LightningInterface);
    const flagsAsOptions: LightningInterfaceOptions = {
      interfacename: flags.name,
      outputdir: flags['output-dir'],
      internal: flags.internal,
      apiversion: flags['api-version'],
      template: 'DefaultLightningIntf',
    };
    return runGenerator({
      templateType: TemplateType.LightningInterface,
      opts: flagsAsOptions,
      ux: new Ux({ jsonEnabled: this.jsonEnabled() }),
      templates: getCustomTemplates(this.configAggregator),
    });
  }
}

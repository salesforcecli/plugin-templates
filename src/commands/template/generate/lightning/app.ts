/*
 * Copyright (c) 2019, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import { Flags, loglevel, orgApiVersionFlagWithDeprecations, SfCommand, Ux } from '@salesforce/sf-plugins-core';
import { CreateOutput, LightningAppOptions, TemplateType } from '@salesforce/templates';
import { CreateUtil } from '@salesforce/templates/lib/utils/index.js';
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
  public static readonly aliases = ['force:lightning:app:create', 'lightning generate app'];
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

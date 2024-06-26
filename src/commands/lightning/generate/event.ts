/*
 * Copyright (c) 2019, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import { Flags, loglevel, orgApiVersionFlagWithDeprecations, SfCommand, Ux } from '@salesforce/sf-plugins-core';
import { CreateOutput, LightningEventOptions, TemplateType } from '@salesforce/templates';
import { CreateUtil } from '@salesforce/templates/lib/utils/index.js';
import { Messages } from '@salesforce/core';
import { getCustomTemplates, runGenerator } from '../../../utils/templateCommand.js';
import { internalFlag, outputDirFlagLightning } from '../../../utils/flags.js';
const lightningEventFileSuffix = /.evt$/;
const BUNDLE_TYPE = 'Event';

Messages.importMessagesDirectoryFromMetaUrl(import.meta.url);

const messages = Messages.loadMessages('@salesforce/plugin-templates', 'lightningEvent');
const lightningCommon = Messages.loadMessages('@salesforce/plugin-templates', 'lightning');

export default class LightningEvent extends SfCommand<CreateOutput> {
  public static readonly summary = lightningCommon.getMessage('summary', [BUNDLE_TYPE]);
  public static readonly description = lightningCommon.getMessage('description', [BUNDLE_TYPE]);
  public static readonly examples = messages.getMessages('examples');
  public static readonly aliases = ['force:lightning:event:create'];
  public static readonly deprecateAliases = true;
  public static readonly flags = {
    name: Flags.string({
      char: 'n',
      summary: lightningCommon.getMessage('flags.name.summary', [BUNDLE_TYPE]),
      description: lightningCommon.getMessage('flags.name.description'),
      required: true,
      aliases: ['eventname'],
      deprecateAliases: true,
    }),
    template: Flags.string({
      char: 't',
      summary: lightningCommon.getMessage('flags.template.summary'),
      description: lightningCommon.getMessage('flags.template.description'),
      default: 'DefaultLightningEvt',
      options: CreateUtil.getCommandTemplatesForFiletype(lightningEventFileSuffix, 'lightningevent'),
    }),
    'output-dir': outputDirFlagLightning,
    'api-version': orgApiVersionFlagWithDeprecations,
    internal: internalFlag,
    loglevel,
  };

  public async run(): Promise<CreateOutput> {
    const { flags } = await this.parse(LightningEvent);
    const flagsAsOptions: LightningEventOptions = {
      apiversion: flags['api-version'],
      outputdir: flags['output-dir'],
      eventname: flags.name,
      template: 'DefaultLightningEvt',
      internal: flags.internal,
    };
    return runGenerator({
      templateType: TemplateType.LightningEvent,
      opts: flagsAsOptions,
      ux: new Ux({ jsonEnabled: this.jsonEnabled() }),
      templates: getCustomTemplates(this.configAggregator),
    });
  }
}

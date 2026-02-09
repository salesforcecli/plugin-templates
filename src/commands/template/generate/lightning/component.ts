/*
 * Copyright (c) 2019, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

// tslint:disable:no-unused-expression

import { Flags, loglevel, orgApiVersionFlagWithDeprecations, SfCommand, Ux } from '@salesforce/sf-plugins-core';
import { CreateOutput, LightningComponentOptions, TemplateType } from '@salesforce/templates';
import { Messages } from '@salesforce/core';
import { getCustomTemplates, runGenerator } from '../../../../utils/templateCommand.js';
import { internalFlag, outputDirFlagLightning } from '../../../../utils/flags.js';
const BUNDLE_TYPE = 'Component';

Messages.importMessagesDirectoryFromMetaUrl(import.meta.url);
const messages = Messages.loadMessages('@salesforce/plugin-templates', 'lightningCmp');
const lightningCommon = Messages.loadMessages('@salesforce/plugin-templates', 'lightning');
export default class LightningComponent extends SfCommand<CreateOutput> {
  public static readonly summary = messages.getMessage('summary');
  public static readonly description = messages.getMessage('description');
  public static readonly examples = messages.getMessages('examples');
  public static readonly aliases = ['force:lightning:component:create', 'lightning:generate:component'];
  public static readonly deprecateAliases = true;
  public static readonly flags = {
    name: Flags.string({
      char: 'n',
      summary: lightningCommon.getMessage('flags.name.summary', [BUNDLE_TYPE]),
      description: lightningCommon.getMessage('flags.name.description'),
      required: true,
      aliases: ['componentname'],
      deprecateAliases: true,
    }),
    template: Flags.option({
      char: 't',
      summary: lightningCommon.getMessage('flags.template.summary'),
      description: lightningCommon.getMessage('flags.template.description'),
      default: 'default',
      // Note: keep this list here and LightningComponentOptions#template in-sync with the
      // templates/lightningcomponents/[aura|lwc]/* folders
      options: ['default', 'analyticsDashboard', 'analyticsDashboardWithStep'] as const,
    })(),
    'output-dir': outputDirFlagLightning,
    'api-version': orgApiVersionFlagWithDeprecations,
    type: Flags.option({
      summary: messages.getMessage('flags.type.summary'),
      options: ['aura', 'lwc'] as const,
      default: 'aura',
    })(),
    internal: internalFlag,
    loglevel,
  };

  public async run(): Promise<CreateOutput> {
    const { flags } = await this.parse(LightningComponent);
    const flagsAsOptions: LightningComponentOptions = {
      componentname: flags.name,
      template: flags.template,
      outputdir: flags['output-dir'],
      apiversion: flags['api-version'],
      internal: flags.internal,
      type: flags.type,
    };
    return runGenerator({
      templateType: TemplateType.LightningComponent,
      opts: flagsAsOptions,
      ux: new Ux({ jsonEnabled: this.jsonEnabled() }),
      templates: getCustomTemplates(this.configAggregator),
    });
  }
}

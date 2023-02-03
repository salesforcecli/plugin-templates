/*
 * Copyright (c) 2019, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

// tslint:disable:no-unused-expression

import { Flags, loglevel, orgApiVersionFlagWithDeprecations, SfCommand, Ux } from '@salesforce/sf-plugins-core';
import { CreateOutput, LightningComponentOptions } from '@salesforce/templates';
import LightningComponentGenerator from '@salesforce/templates/lib/generators/lightningComponentGenerator';
import { Messages } from '@salesforce/core';
import { getCustomTemplates, runGenerator } from '../../../utils/templateCommand';
import { internalFlag, outputDirFlagLightning } from '../../../utils/flags';

const BUNDLE_TYPE = 'Component';

Messages.importMessagesDirectory(__dirname);
const messages = Messages.loadMessages('@salesforce/plugin-templates', 'lightningCmp');
const lightningCommon = Messages.loadMessages('@salesforce/plugin-templates', 'lightning');
export default class LightningComponent extends SfCommand<CreateOutput> {
  public static readonly summary = messages.getMessage('summary');
  public static readonly description = messages.getMessage('description');
  public static readonly examples = messages.getMessages('examples');
  public static readonly aliases = ['force:lightning:component:create'];
  public static readonly deprecateAliases = true;
  public static readonly flags = {
    name: Flags.string({
      char: 'n',
      summary: lightningCommon.getMessage('flags.name', [BUNDLE_TYPE]),
      description: lightningCommon.getMessage('flags.name.description', [BUNDLE_TYPE]),
      required: true,
      aliases: ['componentname'],
      deprecateAliases: true,
    }),
    template: Flags.string({
      char: 't',
      summary: lightningCommon.getMessage('flags.template'),
      description: lightningCommon.getMessage('flags.template.description'),
      default: 'default',
      // Note: keep this list here and LightningComponentOptions#template in-sync with the
      // templates/lightningcomponents/[aura|lwc]/* folders
      options: ['default', 'analyticsDashboard', 'analyticsDashboardWithStep'],
    }),
    'output-dir': outputDirFlagLightning,
    'api-version': orgApiVersionFlagWithDeprecations,
    type: Flags.string({
      summary: messages.getMessage('flags.type'),
      options: ['aura', 'lwc'],
      default: 'aura',
    }),
    internal: internalFlag,
    loglevel,
  };

  public async run(): Promise<CreateOutput> {
    const { flags } = await this.parse(LightningComponent);
    const flagsAsOptions: LightningComponentOptions = {
      componentname: flags.name,
      template: flags.template as 'default' | 'analyticsDashboard' | 'analyticsDashboardWithStep',
      outputdir: flags['output-dir'],
      apiversion: flags['api-version'],
      internal: flags.internal,
      type: flags.type as 'aura' | 'lwc',
    };
    return runGenerator({
      generator: LightningComponentGenerator,
      opts: flagsAsOptions,
      ux: new Ux({ jsonEnabled: this.jsonEnabled() }),
      templates: getCustomTemplates(this.configAggregator),
    });
  }
}

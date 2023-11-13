/*
 * Copyright (c) 2019, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Flags, loglevel, SfCommand, orgApiVersionFlagWithDeprecations, Ux } from '@salesforce/sf-plugins-core';
import { CreateOutput, LightningTestOptions } from '@salesforce/templates';
import LightningTestGenerator from '@salesforce/templates/lib/generators/lightningTestGenerator.js';
import { CreateUtil } from '@salesforce/templates/lib/utils';
import { Messages } from '@salesforce/core';
import { getCustomTemplates, runGenerator } from '../../../utils/templateCommand.js';
import { internalFlag, outputDirFlagLightning } from '../../../utils/flags.js';
const lightningTestFileSuffix = /.resource$/;

Messages.importMessagesDirectory(dirname(fileURLToPath(import.meta.url)));
const messages = Messages.loadMessages('@salesforce/plugin-templates', 'lightningTest');
const lightningMessages = Messages.loadMessages('@salesforce/plugin-templates', 'lightning');
export default class LightningTest extends SfCommand<CreateOutput> {
  public static readonly summary = messages.getMessage('summary');
  public static readonly description = messages.getMessage('description');
  public static readonly examples = messages.getMessages('examples');
  public static readonly aliases = ['force:lightning:test:create'];
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
      template: 'DefaultLightningTest' as LightningTestOptions['template'],
      outputdir: flags['output-dir'],
      internal: flags.internal,
      apiversion: flags['api-version'],
    };
    return runGenerator({
      generator: LightningTestGenerator,
      opts: flagsAsOptions,
      ux: new Ux({ jsonEnabled: this.jsonEnabled() }),
      templates: getCustomTemplates(this.configAggregator),
    });
  }
}

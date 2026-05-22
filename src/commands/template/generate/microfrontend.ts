/*
 * Copyright (c) 2026, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import { Flags, loglevel, orgApiVersionFlagWithDeprecations, SfCommand, Ux } from '@salesforce/sf-plugins-core';
import { CreateOutput, MicrofrontendOptions, TemplateType } from '@salesforce/templates';
import { Messages } from '@salesforce/core';
import { getCustomTemplates, runGenerator } from '../../../utils/templateCommand.js';
import { internalFlag, outputDirFlagLightning } from '../../../utils/flags.js';

Messages.importMessagesDirectoryFromMetaUrl(import.meta.url);
const messages = Messages.loadMessages('@salesforce/plugin-templates', 'microfrontend');

// Keep in-sync with VALID_SANDBOX_TOKENS in salesforcedx-templates/src/generators/microfrontendGenerator.ts
const SANDBOX_TOKENS = [
  'allow-forms',
  'allow-modals',
  'allow-orientation-lock',
  'allow-pointer-lock',
  'allow-popups',
  'allow-popups-to-escape-sandbox',
  'allow-presentation',
  'allow-same-origin',
  'allow-scripts',
  'allow-storage-access-by-user-activation',
  'allow-top-navigation',
  'allow-top-navigation-by-user-activation',
] as const;

export default class Microfrontend extends SfCommand<CreateOutput> {
  public static readonly summary = messages.getMessage('summary');
  public static readonly description = messages.getMessage('description');
  public static readonly examples = messages.getMessages('examples');
  public static readonly hidden = true;

  public static readonly flags = {
    name: Flags.string({
      char: 'n',
      summary: messages.getMessage('flags.name.summary'),
      description: messages.getMessage('flags.name.description'),
      required: true,
    }),
    src: Flags.string({
      char: 's',
      summary: messages.getMessage('flags.src.summary'),
      description: messages.getMessage('flags.src.description'),
      required: true,
    }),
    sandbox: Flags.option({
      summary: messages.getMessage('flags.sandbox.summary'),
      description: messages.getMessage('flags.sandbox.description'),
      options: SANDBOX_TOKENS,
      multiple: true,
      required: true,
    })(),
    'shell-title': Flags.string({
      summary: messages.getMessage('flags.shell-title.summary'),
      description: messages.getMessage('flags.shell-title.description'),
    }),
    'output-dir': outputDirFlagLightning,
    'api-version': orgApiVersionFlagWithDeprecations,
    internal: internalFlag,
    loglevel,
  };

  public async run(): Promise<CreateOutput> {
    const { flags } = await this.parse(Microfrontend);

    const flagsAsOptions: MicrofrontendOptions = {
      componentname: flags.name,
      src: flags.src,
      sandbox: flags.sandbox.join(' '),
      shellTitle: flags['shell-title'] ?? flags.name,
      outputdir: flags['output-dir'],
      apiversion: flags['api-version'],
      internal: flags.internal,
    };

    return runGenerator({
      templateType: TemplateType.Microfrontend,
      opts: flagsAsOptions,
      ux: new Ux({ jsonEnabled: this.jsonEnabled() }),
      templates: getCustomTemplates(this.configAggregator),
    });
  }
}

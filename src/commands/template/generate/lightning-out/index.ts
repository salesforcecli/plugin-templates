/*
 * Copyright (c) 2026, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import { readFile } from 'node:fs/promises';
import { Flags, loglevel, orgApiVersionFlagWithDeprecations, SfCommand, Ux } from '@salesforce/sf-plugins-core';
import { CreateOutput, IframeWhiteListEntry, LightningOutOptions, TemplateType } from '@salesforce/templates';
import { Messages, SfError } from '@salesforce/core';
import { getCustomTemplates, runGenerator } from '../../../../utils/templateCommand.js';
import { outputDirFlagLightning } from '../../../../utils/flags.js';
import { retrieveIframeEntries } from '../../../../utils/lightningOutIframe.js';

Messages.importMessagesDirectoryFromMetaUrl(import.meta.url);
const messages = Messages.loadMessages('@salesforce/plugin-templates', 'lightningOut');

/** Shape of the --definition-file JSON (spec §3.2). */
type LightningOutDefinition = {
  name?: string;
  runtime?: LightningOutOptions['runtime'];
  components?: string[];
  hostDomains?: string[];
  eca?: LightningOutOptions['eca'];
};

/** Parse the definition file as JSON, surfacing a clear error on malformed input. */
async function readDefinition(file: string): Promise<LightningOutDefinition> {
  let raw: string;
  try {
    raw = await readFile(file, 'utf8');
  } catch (e) {
    throw new SfError(messages.getMessage('error.definition-file-read', [file, (e as Error).message]));
  }
  try {
    return JSON.parse(raw) as LightningOutDefinition;
  } catch (e) {
    throw new SfError(messages.getMessage('error.definition-file-json', [file, (e as Error).message]));
  }
}

export default class LightningOut extends SfCommand<CreateOutput> {
  public static readonly summary = messages.getMessage('summary');
  public static readonly description = messages.getMessage('description');
  public static readonly examples = messages.getMessages('examples');
  public static readonly state = 'beta';
  public static readonly hidden = true;

  public static readonly flags = {
    'definition-file': Flags.file({
      char: 'f',
      summary: messages.getMessage('flags.definition-file.summary'),
      description: messages.getMessage('flags.definition-file.description'),
      required: true,
      exists: true,
    }),
    'output-dir': outputDirFlagLightning,
    force: Flags.boolean({
      summary: messages.getMessage('flags.force.summary'),
      description: messages.getMessage('flags.force.description'),
      default: false,
    }),
    'merge-iframe': Flags.boolean({
      summary: messages.getMessage('flags.merge-iframe.summary'),
      description: messages.getMessage('flags.merge-iframe.description'),
      default: false,
    }),
    'target-org': Flags.optionalOrg({
      summary: messages.getMessage('flags.target-org.summary'),
    }),
    'api-version': orgApiVersionFlagWithDeprecations,
    loglevel,
  };

  public async run(): Promise<CreateOutput> {
    const { flags } = await this.parse(LightningOut);

    const def = await readDefinition(flags['definition-file']);

    // Option B (retrieve-merge): read the org's current Trusted Domains for
    // Inline Frames so the generator preserves them instead of wiping the list.
    let existingIframeEntries: IframeWhiteListEntry[] | undefined;
    if (flags['merge-iframe']) {
      const org = flags['target-org'];
      if (!org) {
        throw new SfError(messages.getMessage('error.merge-iframe-requires-org'));
      }
      existingIframeEntries = await retrieveIframeEntries(org.getConnection(flags['api-version']));
      this.info(messages.getMessage('info.merged-iframe-count', [existingIframeEntries.length]));
    } else {
      this.warn(messages.getMessage('warning.iframe-replace'));
    }

    const flagsAsOptions: LightningOutOptions = {
      name: def.name as string,
      runtime: def.runtime as LightningOutOptions['runtime'],
      components: def.components as string[],
      hostDomains: def.hostDomains as string[],
      eca: def.eca as LightningOutOptions['eca'],
      outputdir: flags['output-dir'],
      apiversion: flags['api-version'],
      force: flags.force,
      existingIframeEntries,
    };

    return runGenerator({
      templateType: TemplateType.LightningOut,
      opts: flagsAsOptions,
      ux: new Ux({ jsonEnabled: this.jsonEnabled() }),
      templates: getCustomTemplates(this.configAggregator),
    });
  }
}

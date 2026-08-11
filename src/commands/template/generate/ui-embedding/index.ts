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
import {
  CreateOutput,
  isAllowedUIEmbeddingSrcUrl,
  UI_EMBEDDING_SANDBOX_TOKENS,
  UIEmbeddingOptions,
  TemplateType,
} from '@salesforce/templates';
import { Messages } from '@salesforce/core';
import { getCustomTemplates, runGenerator } from '../../../../utils/templateCommand.js';
import { internalFlag, outputDirFlagLightning } from '../../../../utils/flags.js';

Messages.importMessagesDirectoryFromMetaUrl(import.meta.url);
const messages = Messages.loadMessages('@salesforce/plugin-templates', 'uiEmbedding');

export default class UIEmbedding extends SfCommand<CreateOutput> {
  public static readonly summary = messages.getMessage('summary');
  public static readonly description = messages.getMessage('description');
  public static readonly examples = messages.getMessages('examples');
  public static readonly state = 'beta';
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
      parse: (input: string) => {
        if (!isAllowedUIEmbeddingSrcUrl(input)) {
          throw new Error(messages.getMessage('flags.src.error'));
        }
        return Promise.resolve(input);
      },
    }),
    sandbox: Flags.option({
      summary: messages.getMessage('flags.sandbox.summary'),
      description: messages.getMessage('flags.sandbox.description'),
      options: UI_EMBEDDING_SANDBOX_TOKENS,
      multiple: true,
      required: true,
    })(),
    'shell-title': Flags.string({
      summary: messages.getMessage('flags.shell-title.summary'),
      description: messages.getMessage('flags.shell-title.description'),
      required: true,
    }),
    'output-dir': outputDirFlagLightning,
    'api-version': orgApiVersionFlagWithDeprecations,
    internal: internalFlag,
    loglevel,
  };

  public async run(): Promise<CreateOutput> {
    const { flags } = await this.parse(UIEmbedding);

    const flagsAsOptions: UIEmbeddingOptions = {
      componentname: flags.name,
      src: flags.src,
      sandbox: flags.sandbox.join(' '),
      shellTitle: flags['shell-title'],
      outputdir: flags['output-dir'],
      apiversion: flags['api-version'],
      internal: flags.internal,
    };

    return runGenerator({
      templateType: TemplateType.UIEmbedding,
      opts: flagsAsOptions,
      ux: new Ux({ jsonEnabled: this.jsonEnabled() }),
      templates: getCustomTemplates(this.configAggregator),
    });
  }
}

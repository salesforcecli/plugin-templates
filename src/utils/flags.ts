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
import path from 'node:path';
import url from 'node:url';
import { Flags } from '@salesforce/sf-plugins-core';
import { Messages } from '@salesforce/core';
Messages.importMessagesDirectory(path.dirname(url.fileURLToPath(import.meta.url)));

const messages = Messages.loadMessages('@salesforce/plugin-templates', 'messages');
const lightningMessages = Messages.loadMessages('@salesforce/plugin-templates', 'lightning');

export const outputDirFlag = Flags.string({
  char: 'd',
  summary: messages.getMessage('flags.outputdir.summary'),
  description: messages.getMessage('flags.outputdir.description'),
  default: '.',
  deprecateAliases: true,
  aliases: ['outputdir'],
});

export const outputDirFlagLightning = Flags.string({
  char: 'd',
  summary: messages.getMessage('flags.outputdir.summary'),
  description: messages.getMessage('flags.outputdir.description'),
  default: '.',
  deprecateAliases: true,
  aliases: ['outputdir'],
});

export const internalFlag = Flags.boolean({
  char: 'i',
  summary: lightningMessages.getMessage('flags.internal.summary'),
  hidden: true,
});

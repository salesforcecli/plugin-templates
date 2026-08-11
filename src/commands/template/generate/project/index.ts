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

import { Flags, loglevel, SfCommand, Ux } from '@salesforce/sf-plugins-core';
import { CreateOutput, ProjectOptions, TemplateType } from '@salesforce/templates';
import { Lifecycle, Messages } from '@salesforce/core';
import { getCustomTemplates, runGenerator } from '../../../../utils/templateCommand.js';
import { outputDirFlag } from '../../../../utils/flags.js';

Messages.importMessagesDirectoryFromMetaUrl(import.meta.url);
const messages = Messages.loadMessages('@salesforce/plugin-templates', 'project');
export default class Project extends SfCommand<CreateOutput> {
  public static readonly summary = messages.getMessage('summary');
  public static readonly description = messages.getMessage('description');
  public static readonly examples = messages.getMessages('examples');
  public static readonly aliases = ['force:project:create', 'project:generate'];
  public static readonly deprecateAliases = true;
  public static readonly flags = {
    name: Flags.string({
      char: 'n',
      summary: messages.getMessage('flags.name.summary'),
      description: messages.getMessage('flags.name.description'),
      required: true,
      aliases: ['projectname'],
      deprecateAliases: true,
    }),
    template: Flags.option({
      char: 't',
      summary: messages.getMessage('flags.template.summary'),
      description: messages.getMessage('flags.template.description'),
      default: 'standard',
      options: ['standard', 'empty', 'analytics', 'reactinternalapp', 'reactexternalapp', 'angularinternalapp', 'angularexternalapp', 'agent'] as const,
    })(),
    'output-dir': outputDirFlag,
    namespace: Flags.string({
      char: 's',
      summary: messages.getMessage('flags.namespace.summary'),
      default: '',
    }),
    'default-package-dir': Flags.string({
      char: 'p',
      summary: messages.getMessage('flags.default-package-dir.summary'),
      description: messages.getMessage('flags.default-package-dir.description'),
      default: 'force-app',
      aliases: ['defaultpackagedir'],
      deprecateAliases: true,
    }),
    manifest: Flags.boolean({
      char: 'x',
      summary: messages.getMessage('flags.manifest.summary'),
      description: messages.getMessage('flags.manifest.description'),
    }),
    'login-url': Flags.string({
      char: 'l',
      summary: messages.getMessage('flags.login-url.summary'),
      description: messages.getMessage('flags.login-url.description'),
      default: 'https://login.salesforce.com',
      hidden: true,
      aliases: ['loginurl'],
      deprecateAliases: true,
    }),
    'lwc-language': Flags.option({
      summary: messages.getMessage('flags.lwc-language.summary'),
      description: messages.getMessage('flags.lwc-language.description'),
      options: ['javascript', 'typescript'] as const,
    })(),
    loglevel,
    'api-version': Flags.orgApiVersion({
      summary: messages.getMessage('flags.api-version.summary'),
    }),
  };
  public async run(): Promise<CreateOutput> {
    const { flags } = await this.parse(Project);

    const flagsAsOptions: ProjectOptions = {
      projectname: flags.name,
      outputdir: flags['output-dir'],
      manifest: flags.manifest,
      loginurl: flags['login-url'],
      template: flags.template,
      // namespace is a reserved keyword for the generator
      ns: flags.namespace,
      defaultpackagedir: flags['default-package-dir'],
      apiversion: flags['api-version'],
    };

    if (flags['lwc-language']) {
      flagsAsOptions.lwcLanguage = flags['lwc-language'];
    }

    void Lifecycle.getInstance().emitTelemetry({ eventName: 'project_template_flag_value', template: flags.template });

    return runGenerator({
      templateType: TemplateType.Project,
      opts: flagsAsOptions,
      ux: new Ux({ jsonEnabled: this.jsonEnabled() }),
      templates: getCustomTemplates(this.configAggregator),
    });
  }
}

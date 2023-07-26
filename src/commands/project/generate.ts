/*
 * Copyright (c) 2019, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { Flags, loglevel, SfCommand, Ux } from '@salesforce/sf-plugins-core';
import { CreateOutput, ProjectOptions } from '@salesforce/templates';
import ProjectGenerator from '@salesforce/templates/lib/generators/projectGenerator';
import { Messages } from '@salesforce/core';
import { getCustomTemplates, runGenerator } from '../../utils/templateCommand';
import { outputDirFlag } from '../../utils/flags';

Messages.importMessagesDirectory(__dirname);
const messages = Messages.loadMessages('@salesforce/plugin-templates', 'project');
export default class Project extends SfCommand<CreateOutput> {
  public static readonly summary = messages.getMessage('summary');
  public static readonly description = messages.getMessage('description');
  public static readonly examples = messages.getMessages('examples');
  public static readonly aliases = ['force:project:create'];
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
    template: Flags.string({
      char: 't',
      summary: messages.getMessage('flags.template.summary'),
      description: messages.getMessage('flags.template.description'),
      default: 'standard',
      options: ['standard', 'empty', 'analytics'],
    }),
    'output-dir': outputDirFlag,
    namespace: Flags.string({
      char: 's',
      summary: messages.getMessage('flags.namespace.summary'),
      default: '',
    }),
    'default-package-dir': Flags.string({
      char: 'p',
      summary: messages.getMessage('flags.packagedir.summary'),
      description: messages.getMessage('flags.packagedir.description'),
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
      summary: messages.getMessage('flags.loginurl.summary'),
      description: messages.getMessage('flags.loginurl.description'),
      default: 'https://login.salesforce.com',
      hidden: true,
      aliases: ['loginurl'],
      deprecateAliases: true,
    }),
    loglevel,
    'api-version': Flags.orgApiVersion({
      summary: messages.getMessage('flags.api-version.summary'),
    }),
  };
  public async run(): Promise<CreateOutput> {
    const { flags } = await this.parse(Project);
    flags.ns = flags.namespace;

    const flagsAsOptions: ProjectOptions = {
      projectname: flags.name,
      outputdir: flags['output-dir'],
      manifest: flags.manifest,
      loginurl: flags['login-url'],
      template: flags.template as 'standard' | 'empty' | 'analytics',
      // namespace is a reserved keyword for the generator
      ns: flags.namespace,
      defaultpackagedir: flags['default-package-dir'],
      apiversion: flags['api-version'],
    };
    return runGenerator({
      generator: ProjectGenerator,
      opts: flagsAsOptions,
      ux: new Ux({ jsonEnabled: this.jsonEnabled() }),
      templates: getCustomTemplates(this.configAggregator),
    });
  }
}

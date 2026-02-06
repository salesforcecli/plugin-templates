/*
 * Copyright (c) 2026, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import path from 'node:path';
import { Flags, SfCommand, Ux } from '@salesforce/sf-plugins-core';
import { CreateOutput, DigitalExperienceSiteOptions, TemplateType } from '@salesforce/templates';
import { Messages, SfProject } from '@salesforce/core';
import { getCustomTemplates, runGenerator } from '../../../../utils/templateCommand.js';

Messages.importMessagesDirectoryFromMetaUrl(import.meta.url);
const messages = Messages.loadMessages('@salesforce/plugin-templates', 'digitalExperienceSite');

export default class GenerateSite extends SfCommand<CreateOutput> {
  public static readonly state = 'preview';
  public static readonly summary = messages.getMessage('summary');
  public static readonly description = messages.getMessage('description');
  public static readonly examples = messages.getMessages('examples');
  public static readonly flags = {
    'target-org': Flags.optionalOrg(),
    name: Flags.string({
      char: 'n',
      summary: messages.getMessage('flags.name.summary'),
      required: true,
    }),
    template: Flags.string({
      char: 't',
      summary: messages.getMessage('flags.template.summary'),
      options: ['BuildYourOwnLWR'] as const,
      required: true,
    }),
    'url-path-prefix': Flags.string({
      char: 'p',
      summary: messages.getMessage('flags.url-path-prefix.summary'),
      // each site must have a unique url path prefix, if not provided assume it's empty
      // to mimic UI's behavior
      default: '',
    }),
    'admin-email': Flags.string({
      char: 'e',
      summary: messages.getMessage('flags.admin-email.summary'),
    }),
    'output-dir': Flags.directory({
      char: 'd',
      summary: messages.getMessage('flags.output-dir.summary'),
      description: messages.getMessage('flags.output-dir.description'),
    }),
  };

  /**
   * Resolves the default output directory by reading the project's sfdx-project.json.
   * Returns the path to the default package directory,
   * or falls back to the current directory if not in a project context.
   */
  private static async getDefaultOutputDir(): Promise<string> {
    try {
      const project = await SfProject.resolve();
      const defaultPackage = project.getDefaultPackage();
      return path.join(defaultPackage.path, 'main', 'default');
    } catch {
      return '.';
    }
  }

  public async run(): Promise<CreateOutput> {
    const { flags } = await this.parse(GenerateSite);

    let adminEmail = flags['admin-email'];
    if (!adminEmail) {
      const org = flags['target-org'];
      // If this ever fails to return a username, the default value will be appeneded ".invalid"
      // in admin workspace with a note asking the admin to set a valid email and verify it.
      adminEmail = org?.getConnection()?.getUsername() ?? 'senderEmail@example.com';
    }

    const outputDir = flags['output-dir'] ?? (await GenerateSite.getDefaultOutputDir());

    const flagsAsOptions: DigitalExperienceSiteOptions = {
      sitename: flags.name,
      urlpathprefix: flags['url-path-prefix'],
      adminemail: adminEmail,
      template: flags.template,
      outputdir: outputDir,
    };

    return runGenerator({
      templateType: TemplateType.DigitalExperienceSite,
      opts: flagsAsOptions,
      ux: new Ux({ jsonEnabled: this.jsonEnabled() }),
      templates: getCustomTemplates(this.configAggregator),
    });
  }
}

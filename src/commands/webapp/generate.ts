/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import path from 'node:path';
import { Flags, SfCommand, Ux } from '@salesforce/sf-plugins-core';
import { CreateOutput, WebApplicationOptions, TemplateType } from '@salesforce/templates';
import { Messages, SfProject } from '@salesforce/core';
import { getCustomTemplates, runGenerator } from '../../utils/templateCommand.js';

Messages.importMessagesDirectoryFromMetaUrl(import.meta.url);
const messages = Messages.loadMessages('@salesforce/plugin-templates', 'webApplication');

export default class WebAppGenerate extends SfCommand<CreateOutput> {
  public static readonly summary = messages.getMessage('summary');
  public static readonly description = messages.getMessage('description');
  public static readonly examples = messages.getMessages('examples');
  public static readonly hidden = true; // Hide from external developers until GA
  public static readonly flags = {
    name: Flags.string({
      char: 'n',
      summary: messages.getMessage('flags.name.summary'),
      description: messages.getMessage('flags.name.description'),
      required: true,
    }),
    template: Flags.string({
      char: 't',
      summary: messages.getMessage('flags.template.summary'),
      description: messages.getMessage('flags.template.description'),
      default: 'default',
      options: ['default', 'reactbasic'],
    }),
    label: Flags.string({
      char: 'l',
      summary: messages.getMessage('flags.label.summary'),
      description: messages.getMessage('flags.label.description'),
    }),
    'output-dir': Flags.directory({
      char: 'd',
      summary: messages.getMessage('flags.output-dir.summary'),
      description: messages.getMessage('flags.output-dir.description'),
    }),
    'api-version': Flags.orgApiVersion(),
  };

  /**
   * Get the default output directory for web applications.
   * Uses the project's default package directory + /main/default/webApplications
   * Falls back to current directory if not in a project.
   */
  private static async getDefaultOutputDir(): Promise<string> {
    try {
      const project = await SfProject.resolve();
      const defaultPackage = project.getDefaultPackage();
      return path.join(defaultPackage.path, 'main', 'default', 'webApplications');
    } catch {
      // Not in a Salesforce project, use current directory
      return '.';
    }
  }

  public async run(): Promise<CreateOutput> {
    const { flags } = await this.parse(WebAppGenerate);

    // Resolve output directory: use flag value, or default to project's webApplications folder
    let outputDir = flags['output-dir'];
    if (!outputDir) {
      outputDir = await WebAppGenerate.getDefaultOutputDir();
    }

    const flagsAsOptions: WebApplicationOptions = {
      webappname: flags.name,
      template: flags.template,
      masterlabel: flags.label,
      outputdir: outputDir,
      apiversion: flags['api-version'],
    };

    return runGenerator({
      templateType: TemplateType.WebApplication,
      opts: flagsAsOptions,
      ux: new Ux({ jsonEnabled: this.jsonEnabled() }),
      templates: getCustomTemplates(this.configAggregator),
    });
  }
}

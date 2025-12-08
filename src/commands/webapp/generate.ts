/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import { resolve } from 'node:path';
import { Flags, SfCommand } from '@salesforce/sf-plugins-core';
import { Messages, SfError } from '@salesforce/core';
import fs from 'fs-extra';
import { simpleGit } from 'simple-git';

Messages.importMessagesDirectoryFromMetaUrl(import.meta.url);
const messages = Messages.loadMessages('@salesforce/plugin-templates', 'webapp');

type WebAppTemplate = 'webapp-basic' | 'react-basic' | 'lwc-basic';

const SELECTABLE_TEMPLATES: WebAppTemplate[] = ['react-basic', 'lwc-basic'];
const DEFAULT_TEMPLATE: WebAppTemplate = 'webapp-basic';
const WEB_APPLICATIONS_DIR = 'webApplications';

type TemplateConfig = {
  repo: string;
  branch?: string;
};

// TODO: Update with actual template repository URLs
const TEMPLATE_REPOS: Record<WebAppTemplate, TemplateConfig> = {
  'webapp-basic': {
    repo: 'https://github.com/user/webapp-basic-template.git',
  },
  'react-basic': {
    repo: 'https://github.com/user/react-basic-template.git',
  },
  'lwc-basic': {
    repo: 'https://github.com/user/lwc-basic-template.git',
  },
};

export type WebAppGenerateResult = {
  name: string;
  label: string;
  template: WebAppTemplate;
  outputDir: string;
};

export default class WebAppGenerate extends SfCommand<WebAppGenerateResult> {
  public static readonly summary = messages.getMessage('summary');
  public static readonly description = messages.getMessage('description');
  public static readonly examples = messages.getMessages('examples');

  public static readonly flags = {
    name: Flags.string({
      char: 'n',
      summary: messages.getMessage('flags.name.summary'),
      description: messages.getMessage('flags.name.description'),
      required: true,
    }),
    label: Flags.string({
      char: 'l',
      summary: messages.getMessage('flags.label.summary'),
      description: messages.getMessage('flags.label.description'),
      required: true,
    }),
    template: Flags.string({
      char: 't',
      summary: messages.getMessage('flags.template.summary'),
      description: messages.getMessage('flags.template.description'),
      default: DEFAULT_TEMPLATE,
      options: SELECTABLE_TEMPLATES,
    }),
    'output-dir': Flags.directory({
      char: 'd',
      summary: messages.getMessage('flags.output-dir.summary'),
      description: messages.getMessage('flags.output-dir.description'),
      default: '.',
    }),
    force: Flags.boolean({
      char: 'f',
      summary: messages.getMessage('flags.force.summary'),
      description: messages.getMessage('flags.force.description'),
      default: false,
    }),
  };

  public async run(): Promise<WebAppGenerateResult> {
    const { flags } = await this.parse(WebAppGenerate);

    const template = flags.template as WebAppTemplate;
    const templateConfig = TEMPLATE_REPOS[template];
    const outputDir = resolve(flags['output-dir'], WEB_APPLICATIONS_DIR, flags.name);

    await this.validateOutputDirectory(outputDir, flags.force);

    await this.cloneTemplate(templateConfig, outputDir);

    const result: WebAppGenerateResult = {
      name: flags.name,
      label: flags.label,
      template,
      outputDir,
    };

    this.logResult(result);

    return result;
  }

  private async validateOutputDirectory(outputDir: string, force: boolean): Promise<void> {
    const exists = await fs.pathExists(outputDir);

    if (!exists) {
      return;
    }

    if (!force) {
      throw new SfError(messages.getMessage('error.directoryExists', [outputDir]), 'DirectoryExistsError', [
        messages.getMessage('error.directoryExists.action'),
      ]);
    }

    this.logAsText(messages.getMessage('info.removingDirectory', [outputDir]));
    await fs.remove(outputDir);
  }

  private async cloneTemplate(config: TemplateConfig, outputDir: string): Promise<void> {
    const { repo, branch } = config;

    if (!this.jsonEnabled()) {
      this.spinner.start('Cloning template');
    }

    try {
      const git = simpleGit();

      const cloneOptions = ['--depth', '1'];
      if (branch) {
        cloneOptions.push('--branch', branch);
      }

      await git.clone(repo, outputDir, cloneOptions);

      // Remove .git directory from cloned template
      const gitDir = resolve(outputDir, '.git');
      if (await fs.pathExists(gitDir)) {
        await fs.remove(gitDir);
      }

      if (!this.jsonEnabled()) {
        this.spinner.stop();
      }
    } catch (error) {
      if (!this.jsonEnabled()) {
        this.spinner.stop('Failed');
      }
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new SfError(messages.getMessage('error.cloneFailed', [errorMessage]), 'TemplateCloneError', [
        messages.getMessage('error.cloneFailed.action'),
      ]);
    }
  }

  private logAsText(message: string): void {
    if (!this.jsonEnabled()) {
      this.log(message);
    }
  }

  private logResult(result: WebAppGenerateResult): void {
    if (this.jsonEnabled()) {
      return;
    }

    this.log();
    this.log(`Name: ${result.name}`);
    this.log(`Label: ${result.label}`);
    this.log(`Template: ${result.template}`);
    this.log(`Output directory: ${result.outputDir}`);
    this.log();
    this.log(messages.getMessage('info.success'));
  }
}

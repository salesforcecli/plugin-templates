/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import path from 'node:path';
import fs from 'node:fs/promises';
import { Flags, SfCommand, Ux } from '@salesforce/sf-plugins-core';
import { CreateOutput, UIBundleOptions, TemplateType } from '@salesforce/templates';
import { Messages, SfProject } from '@salesforce/core';
import { getCustomTemplates, runGenerator } from '../../../../utils/templateCommand.js';

Messages.importMessagesDirectoryFromMetaUrl(import.meta.url);
const messages = Messages.loadMessages('@salesforce/plugin-templates', 'ui-bundle.generate');

export const UI_BUNDLES_DIR = 'uiBundles';
const GRAPHQLRC_FILENAME = '.graphqlrc.yml';

export default class UiBundleGenerate extends SfCommand<CreateOutput> {
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
    template: Flags.string({
      char: 't',
      summary: messages.getMessage('flags.template.summary'),
      description: messages.getMessage('flags.template.description'),
      default: 'default',
      options: ['default', 'reactbasic', 'angularbasic', 'angularvite'],
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
   * Resolves the default output directory by reading the project's sfdx-project.json.
   * Returns the path to uiBundles under the default package directory,
   * or falls back to the current directory if not in a project context.
   */
  private static async getDefaultOutputDir(): Promise<string> {
    try {
      const project = await SfProject.resolve();
      const defaultPackage = project.getDefaultPackage();
      return path.join(defaultPackage.path, 'main', 'default', UI_BUNDLES_DIR);
    } catch {
      return '.';
    }
  }

  /**
   * Creates a new `.graphqlrc.yml` at the sfdx project root so the GraphQL LSP extension
   * can auto-discover it. The file at the project root references `schema.graphql` as a
   * sibling and uses a recursive glob for documents so nested ui-bundle src trees are picked up.
   *
   * Returns the new file path on success, or undefined when not running inside an sfdx project,
   * when the bundle's `.graphqlrc.yml` was not generated, or when a `.graphqlrc.yml` already
   * exists at the project root.
   */
  private static async createGraphqlrcAtProjectRoot(bundleSourcePath: string): Promise<string | undefined> {
    let projectRoot: string;
    try {
      const project = await SfProject.resolve();
      projectRoot = project.getPath();
    } catch {
      return undefined;
    }

    try {
      await fs.access(bundleSourcePath);
    } catch {
      return undefined;
    }

    const targetPath = path.join(projectRoot, GRAPHQLRC_FILENAME);
    try {
      await fs.access(targetPath);
      return undefined;
    } catch {
      // target does not exist — proceed
    }

    const content = "schema: 'schema.graphql'\ndocuments: './**/src/**/*.{graphql,js,ts,jsx,tsx}'\n";
    await fs.writeFile(targetPath, content);
    return targetPath;
  }

  public async run(): Promise<CreateOutput> {
    const { flags } = await this.parse(UiBundleGenerate);

    const outputDir = flags['output-dir'] ?? (await UiBundleGenerate.getDefaultOutputDir());

    const flagsAsOptions: UIBundleOptions = {
      bundlename: flags.name,
      template: flags.template,
      masterlabel: flags.label,
      outputdir: outputDir,
      apiversion: flags['api-version'],
    };

    const ux = new Ux({ jsonEnabled: this.jsonEnabled() });

    const result = await runGenerator({
      templateType: TemplateType.UIBundle,
      opts: flagsAsOptions,
      ux,
      templates: getCustomTemplates(this.configAggregator),
    });

    if (flags.template === 'reactbasic') {
      const bundleSourcePath = path.join(result.outputDir, flags.name, GRAPHQLRC_FILENAME);
      const newPath = await UiBundleGenerate.createGraphqlrcAtProjectRoot(bundleSourcePath);
      if (newPath) {
        const targetRelative = path.relative(process.cwd(), newPath);
        const createLine = `  create ${targetRelative}`;
        ux.log(createLine);
        return {
          ...result,
          created: [...result.created, targetRelative],
          rawOutput: `${result.rawOutput.replace(/\n$/, '')}\n${createLine}\n`,
        };
      }
    }

    return result;
  }
}

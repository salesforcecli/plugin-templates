/*
 * Copyright (c) 2019, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { Flags, loglevel, orgApiVersionFlagWithDeprecations, SfCommand, Ux } from '@salesforce/sf-plugins-core';
import VisualforcePageGenerator from '@salesforce/templates/lib/generators/visualforcePageGenerator';
import { CreateOutput, CreateUtil, VisualforcePageOptions } from '@salesforce/templates';
import { Messages } from '@salesforce/core';
import { getCustomTemplates, runGenerator } from '../../../utils/templateCommand';
import { outputDirFlag } from '../../../utils/flags';
const visualforcePageFileSuffix = /.page$/;
const VF_TYPE = 'Page';

Messages.importMessagesDirectory(__dirname);
const commonMessages = Messages.loadMessages('@salesforce/plugin-templates', 'messages');
const messages = Messages.loadMessages('@salesforce/plugin-templates', 'vf');
export default class VisualforcePage extends SfCommand<CreateOutput> {
  public static readonly summary = messages.getMessage('summary', [VF_TYPE]);
  public static readonly description = messages.getMessage('description', [VF_TYPE, VF_TYPE]);
  public static readonly examples = messages.getMessages('examples.page');
  public static readonly aliases = ['force:visualforce:page:create'];
  public static readonly deprecateAliases = true;
  public static readonly flags = {
    name: Flags.string({
      char: 'n',
      summary: messages.getMessage('flags.name', [VF_TYPE]),
      description: messages.getMessage('flags.name.description', [VF_TYPE]),
      required: true,
      aliases: ['pagename'],
      deprecateAliases: true,
    }),
    // there is only one valid template in the interface for VisualforcePageOptions
    template: Flags.string({
      char: 't',
      summary: commonMessages.getMessage('flags.template'),
      description: commonMessages.getMessage('flags.template.description'),
      default: 'DefaultVFPage',
      hidden: true,
      options: CreateUtil.getCommandTemplatesForFiletype(visualforcePageFileSuffix, 'visualforcepage'),
    }),
    'output-dir': outputDirFlag,

    'api-version': orgApiVersionFlagWithDeprecations,
    label: Flags.string({
      char: 'l',
      summary: messages.getMessage('flags.label', [VF_TYPE]),
      required: true,
    }),
    loglevel,
  };

  public async run(): Promise<CreateOutput> {
    const { flags } = await this.parse(VisualforcePage);

    // translate the new flags to the old ones the generator expects
    const flagsAsOptions: VisualforcePageOptions = {
      pagename: flags.name,
      label: flags.label,
      template: 'DefaultVFPage' as VisualforcePageOptions['template'],
      outputdir: flags['output-dir'],
      apiversion: flags['api-version'],
    };
    return runGenerator({
      generator: VisualforcePageGenerator,
      opts: flagsAsOptions,
      ux: new Ux({ jsonEnabled: this.jsonEnabled() }),
      templates: getCustomTemplates(this.configAggregator),
    });
  }
}

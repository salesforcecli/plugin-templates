/*
 * Copyright (c) 2019, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import * as path from 'node:path';
import { Ux } from '@salesforce/sf-plugins-core';
import { OrgConfigProperties, ConfigAggregator, Messages } from '@salesforce/core';
import { TemplateService, CreateOutput } from '@salesforce/templates';
import { ForceGeneratorAdapter } from '@salesforce/templates/lib/utils';
import * as yeoman from 'yeoman-environment';

import VisualforceComponentGenerator from '@salesforce/templates/lib/generators/visualforceComponentGenerator';
import VisualforcePageGenerator from '@salesforce/templates/lib/generators/visualforcePageGenerator';
import ApexClassGenerator from '@salesforce/templates/lib/generators/apexClassGenerator';
import LightningTestGenerator from '@salesforce/templates/lib/generators/lightningTestGenerator';
import StaticResourceGenerator from '@salesforce/templates/lib/generators/staticResourceGenerator';
import ProjectGenerator from '@salesforce/templates/lib/generators/projectGenerator';
import LightningInterfaceGenerator from '@salesforce/templates/lib/generators/lightningInterfaceGenerator';
import LightningAppGenerator from '@salesforce/templates/lib/generators/lightningAppGenerator';
import LightningEventGenerator from '@salesforce/templates/lib/generators/lightningEventGenerator';
import AnalyticsTemplateGenerator from '@salesforce/templates/lib/generators/analyticsTemplateGenerator';
import LightningComponentGenerator from '@salesforce/templates/lib/generators/lightningComponentGenerator';
import ApexTriggerGenerator from '@salesforce/templates/lib/generators/apexTriggerGenerator';

Messages.importMessagesDirectory(__dirname);
const messages = Messages.loadMessages('@salesforce/plugin-templates', 'messages');

export type generatorInputs = {
  ux: Ux;
  templates?: string;
} & (
  | {
      generator: typeof VisualforcePageGenerator;
      opts: typeof VisualforcePageGenerator.prototype.options;
    }
  | {
      generator: typeof ApexClassGenerator;
      opts: typeof ApexClassGenerator.prototype.options;
    }
  | {
      generator: typeof ApexTriggerGenerator;
      opts: typeof ApexTriggerGenerator.prototype.options;
    }
  | {
      generator: typeof VisualforceComponentGenerator;
      opts: typeof VisualforceComponentGenerator.prototype.options;
    }
  | {
      generator: typeof LightningTestGenerator;
      opts: typeof LightningTestGenerator.prototype.options;
    }
  | {
      generator: typeof StaticResourceGenerator;
      opts: typeof StaticResourceGenerator.prototype.options;
    }
  | {
      generator: typeof ProjectGenerator;
      opts: typeof ProjectGenerator.prototype.options;
    }
  | {
      generator: typeof LightningInterfaceGenerator;
      opts: typeof LightningInterfaceGenerator.prototype.options;
    }
  | {
      generator: typeof LightningAppGenerator;
      opts: typeof LightningAppGenerator.prototype.options;
    }
  | {
      generator: typeof LightningEventGenerator;
      opts: typeof LightningEventGenerator.prototype.options;
    }
  | {
      generator: typeof AnalyticsTemplateGenerator;
      opts: typeof AnalyticsTemplateGenerator.prototype.options;
    }
  | {
      generator: typeof LightningComponentGenerator;
      opts: typeof LightningComponentGenerator.prototype.options;
    }
);

export async function runGenerator({ ux, templates, generator, opts }: generatorInputs): Promise<CreateOutput> {
  if (templates) {
    await TemplateService.getInstance().setCustomTemplatesRootPathOrGitRepo(templates);
  }

  const adapter = new ForceGeneratorAdapter();
  // @ts-expect-error the adapter doesn't fully implement the yeoman adapter interface
  const env = yeoman.createEnv(undefined, undefined, adapter);
  env.registerStub(generator, 'generator');

  await env.run('generator', opts);
  const targetDir = path.resolve(opts.outputdir ?? '.');

  ux.log(messages.getMessage('TargetDirOutput', [targetDir]));
  ux.log(adapter.log.getOutput());
  return buildJson(adapter, targetDir);
}

export const getCustomTemplates = (configAggregator: ConfigAggregator): string | undefined => {
  try {
    // we're still accessing the old `customOrgMetadataTemplates` key, but this is deprecated and we'll use the new key to access the value
    const customTemplatesFromConfig = configAggregator.getPropertyValue(
      OrgConfigProperties.ORG_CUSTOM_METADATA_TEMPLATES
    ) as string;
    return customTemplatesFromConfig;
  } catch (err) {
    return undefined;
  }
};

// exported for test
export const buildJson = (adapter: ForceGeneratorAdapter, targetDir: string): CreateOutput => {
  const cleanOutput = adapter.log.getCleanOutput();
  const rawOutput = `target dir = ${targetDir}\n${adapter.log.getOutput()}`;
  const output = {
    outputDir: targetDir,
    created: cleanOutput,
    rawOutput,
  };
  return output;
};

/*
 * Copyright (c) 2019, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Ux } from '@salesforce/sf-plugins-core';
import { ConfigAggregator, Messages, OrgConfigProperties } from '@salesforce/core';
import { CreateOutput, TemplateService } from '@salesforce/templates';
import yeoman from 'yeoman-environment';

import { ForceGeneratorAdapter } from '@salesforce/templates/lib/utils/index.js';
import VisualforceComponentGenerator from '@salesforce/templates/lib/generators/visualforceComponentGenerator.js';
import VisualforcePageGenerator from '@salesforce/templates/lib/generators/visualforcePageGenerator.js';
import ApexClassGenerator from '@salesforce/templates/lib/generators/apexClassGenerator.js';
import LightningTestGenerator from '@salesforce/templates/lib/generators/lightningTestGenerator.js';
import StaticResourceGenerator from '@salesforce/templates/lib/generators/staticResourceGenerator.js';
import ProjectGenerator from '@salesforce/templates/lib/generators/projectGenerator.js';
import LightningInterfaceGenerator from '@salesforce/templates/lib/generators/lightningInterfaceGenerator.js';
import LightningAppGenerator from '@salesforce/templates/lib/generators/lightningAppGenerator.js';
import LightningEventGenerator from '@salesforce/templates/lib/generators/lightningEventGenerator.js';
import AnalyticsTemplateGenerator from '@salesforce/templates/lib/generators/analyticsTemplateGenerator.js';
import LightningComponentGenerator from '@salesforce/templates/lib/generators/lightningComponentGenerator.js';
import ApexTriggerGenerator from '@salesforce/templates/lib/generators/apexTriggerGenerator.js';

Messages.importMessagesDirectory(path.dirname(fileURLToPath(import.meta.url)));
const messages = Messages.loadMessages('@salesforce/plugin-templates', 'messages');

export type generatorInputs = {
  ux: Ux;
  templates?: string;
} & (
  | {
      generator: typeof VisualforcePageGenerator;
      opts: typeof VisualforcePageGenerator.default.prototype.options;
    }
  | {
      generator: typeof ApexClassGenerator;
      opts: typeof ApexClassGenerator.default.prototype.options;
    }
  | {
      generator: typeof ApexTriggerGenerator;
      opts: typeof ApexTriggerGenerator.default.prototype.options;
    }
  | {
      generator: typeof VisualforceComponentGenerator;
      opts: typeof VisualforceComponentGenerator.default.prototype.options;
    }
  | {
      generator: typeof LightningTestGenerator;
      opts: typeof LightningTestGenerator.default.prototype.options;
    }
  | {
      generator: typeof StaticResourceGenerator;
      opts: typeof StaticResourceGenerator.default.prototype.options;
    }
  | {
      generator: typeof ProjectGenerator;
      opts: typeof ProjectGenerator.default.prototype.options;
    }
  | {
      generator: typeof LightningInterfaceGenerator;
      opts: typeof LightningInterfaceGenerator.default.prototype.options;
    }
  | {
      generator: typeof LightningAppGenerator;
      opts: typeof LightningAppGenerator.default.prototype.options;
    }
  | {
      generator: typeof LightningEventGenerator;
      opts: typeof LightningEventGenerator.default.prototype.options;
    }
  | {
      generator: typeof AnalyticsTemplateGenerator;
      opts: typeof AnalyticsTemplateGenerator.default.prototype.options;
    }
  | {
      generator: typeof LightningComponentGenerator;
      opts: typeof LightningComponentGenerator.default.prototype.options;
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
    return configAggregator.getPropertyValue(OrgConfigProperties.ORG_CUSTOM_METADATA_TEMPLATES) as string;
  } catch (err) {
    return undefined;
  }
};

// exported for test
export const buildJson = (adapter: ForceGeneratorAdapter, targetDir: string): CreateOutput => {
  const cleanOutput = adapter.log.getCleanOutput();
  const rawOutput = `target dir = ${targetDir}\n${adapter.log.getOutput()}`;
  return {
    outputDir: targetDir,
    created: cleanOutput,
    rawOutput,
  };
};

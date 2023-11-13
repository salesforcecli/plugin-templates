/*
 * Copyright (c) 2019, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import path from 'node:path';
import url from 'node:url';
import { Ux } from '@salesforce/sf-plugins-core';
import { ConfigAggregator, Messages, OrgConfigProperties } from '@salesforce/core';
import { CreateOutput, TemplateService } from '@salesforce/templates';
import yeoman from 'yeoman-environment';
import VisualforceComponentGenerator from '@salesforce/templates/lib/generators/visualforceComponentGenerator.js';
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
import { ForceGeneratorAdapter } from '@salesforce/templates/lib/utils';
import VisualforcePageGenerator from '@salesforce/templates/lib/generators/visualforcePageGenerator.js';
import { TemplateOptions } from '@salesforce/templates/lib/utils/types.js';

Messages.importMessagesDirectory(path.dirname(url.fileURLToPath(import.meta.url)));
const messages = Messages.loadMessages('@salesforce/plugin-templates', 'messages');

export type generatorInputs = {
  ux: Ux;
  templates?: string;
} & (
  | {
      generator: typeof VisualforcePageGenerator;
      opts: TemplateOptions;
    }
  | {
      generator: typeof ApexClassGenerator;
      opts: TemplateOptions;
    }
  | {
      generator: typeof ApexTriggerGenerator;
      opts: TemplateOptions;
    }
  | {
      generator: typeof VisualforceComponentGenerator;
      opts: TemplateOptions;
    }
  | {
      generator: typeof LightningTestGenerator;
      opts: TemplateOptions;
    }
  | {
      generator: typeof StaticResourceGenerator;
      opts: TemplateOptions;
    }
  | {
      generator: typeof ProjectGenerator;
      opts: TemplateOptions;
    }
  | {
      generator: typeof LightningInterfaceGenerator;
      opts: TemplateOptions;
    }
  | {
      generator: typeof LightningAppGenerator;
      opts: TemplateOptions;
    }
  | {
      generator: typeof LightningEventGenerator;
      opts: TemplateOptions;
    }
  | {
      generator: typeof AnalyticsTemplateGenerator;
      opts: TemplateOptions;
    }
  | {
      generator: typeof LightningComponentGenerator;
      opts: TemplateOptions;
    }
);

export async function runGenerator({ ux, templates, generator, opts }: generatorInputs): Promise<CreateOutput> {
  if (templates) {
    await TemplateService.getInstance().setCustomTemplatesRootPathOrGitRepo(templates);
  }

  const adapter = new ForceGeneratorAdapter();
  // @ts-expect-error the adapter doesn't fully implement the yeoman adapter interface
  const env = yeoman.createEnv(undefined, undefined, adapter);
  // @ts-ignore
  env.registerStub(generator, 'generator');

  await env.run('generator', opts);
  const targetDir = path.resolve(opts?.outputdir ?? '.');

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

/*
 * Copyright (c) 2019, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import { Ux } from '@salesforce/sf-plugins-core';
import { ConfigAggregator, Lifecycle, OrgConfigProperties } from '@salesforce/core';
import { CreateOutput, TemplateOptions, TemplateService, TemplateType } from '@salesforce/templates';

export type GeneratorInputs = {
  ux: Ux;
  templates?: string;
  templateType: TemplateType;
  opts: TemplateOptions;
};

export async function runGenerator({ ux, templates, templateType, opts }: GeneratorInputs): Promise<CreateOutput> {
  const templateService = TemplateService.getInstance();
  const result = await templateService.create(templateType, opts, templates);
  ux.log(result.rawOutput);
  return result;
}

export const getCustomTemplates = (configAggregator: ConfigAggregator): string | undefined => {
  try {
    const info = configAggregator.getInfo(OrgConfigProperties.ORG_CUSTOM_METADATA_TEMPLATES);
    if (info.isLocal()) {
      void Lifecycle.getInstance().emitWarning(
        'Setting "org-custom-metadata-templates" in local project config (.sf/config.json) is deprecated ' +
          'due to security concerns and will stop being honored in a future release. ' +
          'Use "sf config set --global org-custom-metadata-templates=<path>" instead.'
      );
    }
    return info.value as string | undefined;
  } catch (err) {
    return undefined;
  }
};

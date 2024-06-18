/*
 * Copyright (c) 2019, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import { Ux } from '@salesforce/sf-plugins-core';
import { ConfigAggregator, OrgConfigProperties } from '@salesforce/core';
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
    // we're still accessing the old `customOrgMetadataTemplates` key, but this is deprecated and we'll use the new key to access the value
    return configAggregator.getPropertyValue(OrgConfigProperties.ORG_CUSTOM_METADATA_TEMPLATES) as string;
  } catch (err) {
    return undefined;
  }
};

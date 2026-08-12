/*
 * Copyright 2025, Salesforce, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
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
    return configAggregator.getPropertyValue(OrgConfigProperties.ORG_CUSTOM_METADATA_TEMPLATES);
  } catch {
    return undefined;
  }
};

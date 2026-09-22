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

import * as fs from 'node:fs';
import { Flags, loglevel, SfCommand, Ux } from '@salesforce/sf-plugins-core';
import { CreateOutput, LightningOutOptions, TemplateType } from '@salesforce/templates';
import { Messages, SfProject } from '@salesforce/core';
import { getCustomTemplates, runGenerator } from '../../../../utils/templateCommand.js';
import { outputDirFlagLightning } from '../../../../utils/flags.js';

Messages.importMessagesDirectoryFromMetaUrl(import.meta.url);
const messages = Messages.loadMessages('@salesforce/plugin-templates', 'lightningOut');

/** Flat flag shape read by {@link mergeLightningOutInputs} — a structural subset of the parsed oclif flags. */
type LightningOutFlags = {
  'app-name'?: string;
  'eca-name'?: string;
  runtime?: 'LWR_CORE' | 'CLWR';
  'host-domains'?: string[];
  components?: string[];
  'eca-contact-email'?: string;
  'eca-callback-url'?: string;
  'output-dir'?: string;
};

/** Parse the --definition-file JSON, surfacing a clear error on malformed or non-object input. */
export function readDefinition(file: string): Record<string, unknown> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (e) {
    throw messages.createError('error.definition-file-json', [file, (e as Error).message]);
  }
  if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw messages.createError('error.definition-file-not-object', [file]);
  }
  return parsed as Record<string, unknown>;
}

/** True when a value is an array whose every element is a string. */
function isStringArray(v: unknown): boolean {
  return Array.isArray(v) && v.every((x) => typeof x === 'string');
}

/**
 * Validate the types of --definition-file fields before they reach the generator, so wrong-typed
 * JSON (e.g. `"appName": 123`) yields an actionable error here rather than an internal TypeError
 * from the generator (which calls `.trim()` on string fields). A field is skipped when the matching
 * flag overrides it, since flags always arrive as strings and win per-key (see mergeLightningOutInputs).
 */
export function validateDefinitionShape(defn: Record<string, unknown>, flags: LightningOutFlags): void {
  const requireString = (overridden: boolean, val: unknown, key: string): void => {
    if (!overridden && val !== undefined && typeof val !== 'string') {
      throw messages.createError('error.definition-file-field-type', [key, 'a string']);
    }
  };
  const requireStringArray = (overridden: boolean, val: unknown, key: string): void => {
    if (!overridden && val !== undefined && !isStringArray(val)) {
      throw messages.createError('error.definition-file-field-type', [key, 'an array of strings']);
    }
  };

  requireString(flags['app-name'] !== undefined, defn.appName, 'appName');
  requireString(flags.runtime !== undefined, defn.runtime, 'runtime');
  requireStringArray(flags['host-domains'] !== undefined, defn.hostDomains, 'hostDomains');
  requireStringArray(flags.components !== undefined, defn.components, 'components');

  if (defn.eca !== undefined) {
    if (typeof defn.eca !== 'object' || defn.eca === null || Array.isArray(defn.eca)) {
      throw messages.createError('error.definition-file-field-type', ['eca', 'an object']);
    }
    const eca = defn.eca as Record<string, unknown>;
    requireString(flags['eca-name'] !== undefined, eca.name, 'eca.name');
    requireString(flags['eca-contact-email'] !== undefined, eca.contactEmail, 'eca.contactEmail');
    requireString(flags['eca-callback-url'] !== undefined, eca.callbackUrl, 'eca.callbackUrl');
  }
}

/**
 * Merge the --definition-file JSON with individual flags into one LightningOutOptions, with
 * per-key precedence (flags win over the file) and wholesale list-replace semantics for
 * hostDomains/components (never merge/concat). All structural validation (required-ness, shape,
 * formats) is the generator's job — this function only resolves precedence.
 */
export function mergeLightningOutInputs(
  defn: Record<string, unknown>,
  flags: LightningOutFlags
): { opts: LightningOutOptions; unknownKeys: string[] } {
  const known = new Set(['appName', 'runtime', 'hostDomains', 'components', 'eca']);
  const unknownKeys = Object.keys(defn).filter((k) => !known.has(k));
  const ecaDefn = (defn.eca ?? {}) as Record<string, unknown>;
  const opts: LightningOutOptions = {
    appName: flags['app-name'] ?? (defn.appName as string),
    runtime: (flags.runtime ?? defn.runtime) as LightningOutOptions['runtime'],
    hostDomains: flags['host-domains'] ?? (defn.hostDomains as string[]) ?? [],
    components: flags.components ?? (defn.components as string[]),
    eca: {
      name: flags['eca-name'] ?? (ecaDefn.name as string),
      contactEmail: flags['eca-contact-email'] ?? (ecaDefn.contactEmail as string),
      callbackUrl: flags['eca-callback-url'] ?? (ecaDefn.callbackUrl as string),
    },
    outputdir: flags['output-dir'],
  };
  return { opts, unknownKeys };
}

/**
 * Resolve the local DX project's `sourceApiVersion`, used only for a CLI-side advisory warning
 * (the generator itself has no project context). Returns undefined when there's no DX project —
 * generating outside a project must not error.
 */
async function getSourceApiVersion(): Promise<string | undefined> {
  try {
    const project = await SfProject.resolve();
    const projectJson = await project.resolveProjectConfig();
    return projectJson.sourceApiVersion as string | undefined;
  } catch (e) {
    return undefined;
  }
}

/** True when a project sourceApiVersion is present and below the v68.0 deploy floor. Pure; testable. */
export function isBelowApiFloor(projApi: string | undefined): boolean {
  return !!projApi && Number(projApi) < 68;
}

/**
 * Quote a path for safe copy-paste into a POSIX shell when it contains whitespace or quote chars,
 * so the suggested deploy command survives output dirs such as "/tmp/Lightning Out".
 */
export function shellQuoteArg(p: string): string {
  return /[\s"'\\]/.test(p) ? `'${p.replace(/'/g, "'\\''")}'` : p;
}

export default class LightningOut extends SfCommand<CreateOutput> {
  public static readonly summary = messages.getMessage('summary');
  public static readonly description = messages.getMessage('description');
  public static readonly examples = messages.getMessages('examples');
  public static readonly state = 'beta';
  public static readonly hidden = true;

  public static readonly flags = {
    'app-name': Flags.string({ summary: messages.getMessage('flags.app-name.summary'), required: false }),
    'eca-name': Flags.string({ summary: messages.getMessage('flags.eca-name.summary'), required: false }),
    runtime: Flags.option({
      options: ['LWR_CORE', 'CLWR'] as const,
      summary: messages.getMessage('flags.runtime.summary'),
    })(),
    'host-domains': Flags.string({ summary: messages.getMessage('flags.host-domains.summary'), multiple: true }),
    components: Flags.string({ summary: messages.getMessage('flags.components.summary'), multiple: true }),
    'eca-contact-email': Flags.string({ summary: messages.getMessage('flags.eca-contact-email.summary') }),
    'eca-callback-url': Flags.string({ summary: messages.getMessage('flags.eca-callback-url.summary') }),
    'definition-file': Flags.file({ exists: true, summary: messages.getMessage('flags.definition-file.summary') }),
    'output-dir': outputDirFlagLightning,
    loglevel,
  };

  public async run(): Promise<CreateOutput> {
    const { flags } = await this.parse(LightningOut);
    const defn = flags['definition-file'] ? readDefinition(flags['definition-file']) : {};
    validateDefinitionShape(defn, flags);
    const { opts, unknownKeys } = mergeLightningOutInputs(defn, flags);

    unknownKeys.forEach((k) => this.warn(messages.getMessage('warning.unknown-definition-key', [k])));

    const result = await runGenerator({
      templateType: TemplateType.LightningOut,
      opts,
      ux: new Ux({ jsonEnabled: this.jsonEnabled() }),
      templates: getCustomTemplates(this.configAggregator),
    });

    // CLI-side sourceApiVersion floor check (the generator has no project context).
    const projApi = await getSourceApiVersion();
    if (isBelowApiFloor(projApi)) {
      this.warn(messages.getMessage('warning.source-api-version', [String(projApi)]));
    }

    // Success guidance (suppressed automatically under --json).
    const outputDir = opts.outputdir ?? '.';
    this.log(messages.getMessage('success.next-step', [outputDir, shellQuoteArg(outputDir)]));
    this.info(messages.getMessage('success.app-id'));
    this.info(messages.getMessage('success.dont-delete'));
    this.info(messages.getMessage('success.eca-overwrite', [opts.eca.name ?? '']));
    this.info(messages.getMessage('success.components-exist'));
    this.info(messages.getMessage('success.frontdoor'));

    return result; // --json returns the full CreateOutput (created[])
  }
}

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
import * as path from 'node:path';
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
  site?: string;
  access?: 'guest' | 'authenticated';
  'output-dir'?: string;
};

const KNOWN_KEYS = ['appName', 'runtime', 'hostDomains', 'components', 'eca', 'site', 'access'] as const;
const KNOWN_ECA_KEYS = ['name', 'contactEmail', 'callbackUrl'] as const;
/** First API version whose LightningOutApp accepts <sites>; at/after it, omitting <sites> can unlink. */
const SITES_API_VERSION = 69;

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
 * An explicit JSON null counts as absent, matching the generator.
 */
export function validateDefinitionShape(defn: Record<string, unknown>, flags: LightningOutFlags): void {
  const requireString = (overridden: boolean, val: unknown, key: string): void => {
    if (!overridden && val != null && typeof val !== 'string') {
      throw messages.createError('error.definition-file-field-type', [key, 'a string']);
    }
  };
  const requireStringArray = (overridden: boolean, val: unknown, key: string): void => {
    if (!overridden && val != null && !isStringArray(val)) {
      throw messages.createError('error.definition-file-field-type', [key, 'an array of strings']);
    }
  };

  requireString(flags['app-name'] !== undefined, defn.appName, 'appName');
  requireString(flags.runtime !== undefined, defn.runtime, 'runtime');
  requireStringArray(flags['host-domains'] !== undefined, defn.hostDomains, 'hostDomains');
  requireStringArray(flags.components !== undefined, defn.components, 'components');
  requireString(flags.site !== undefined, defn.site, 'site');
  requireString(flags.access !== undefined, defn.access, 'access');

  if (defn.eca != null) {
    if (typeof defn.eca !== 'object' || Array.isArray(defn.eca)) {
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
): { opts: LightningOutOptions; unknownKeys: string[]; unknownEcaKeys: string[] } {
  const known: ReadonlySet<string> = new Set(KNOWN_KEYS);
  const knownEca: ReadonlySet<string> = new Set(KNOWN_ECA_KEYS);
  const ecaDefn = (defn.eca ?? {}) as Record<string, unknown>;
  // Nested eca.* keys are reported too, so a typo like "eca.callbackURL" isn't silently dropped.
  const unknownKeys = Object.keys(defn).filter((k) => !known.has(k));
  const unknownEcaKeys = Object.keys(ecaDefn).filter((k) => !knownEca.has(k));
  // An explicit JSON null counts as absent, so the `site === undefined` checks below stay sound.
  const val = <T>(v: unknown): T | undefined => (v ?? undefined) as T | undefined;
  const opts: LightningOutOptions = {
    appName: flags['app-name'] ?? (val<string>(defn.appName) as string),
    runtime: (flags.runtime ?? val(defn.runtime)) as LightningOutOptions['runtime'],
    hostDomains: flags['host-domains'] ?? val<string[]>(defn.hostDomains) ?? [],
    components: flags.components ?? val<string[]>(defn.components),
    eca: {
      name: flags['eca-name'] ?? (val<string>(ecaDefn.name) as string),
      contactEmail: flags['eca-contact-email'] ?? (val<string>(ecaDefn.contactEmail) as string),
      callbackUrl: flags['eca-callback-url'] ?? (val<string>(ecaDefn.callbackUrl) as string),
    },
    site: flags.site ?? val<string>(defn.site),
    access: flags.access ?? val(defn.access),
    outputdir: flags['output-dir'],
  };
  return { opts, unknownKeys, unknownEcaKeys };
}

/**
 * Absolute path of `p` with symlinks resolved in its nearest existing ancestor, so a symlinked
 * --output-dir is judged by the project it really lives in (the directory may not exist yet).
 */
function realExistingPath(p: string): string {
  let cur = path.resolve(p);
  const rest: string[] = [];
  while (!fs.existsSync(cur) && path.dirname(cur) !== cur) {
    rest.unshift(path.basename(cur));
    cur = path.dirname(cur);
  }
  try {
    cur = fs.realpathSync(cur);
  } catch {
    // keep the lexical path
  }
  return path.join(cur, ...rest);
}

/**
 * Resolve the DX project that contains `dir` and its `sourceApiVersion` (the generator itself has no
 * project context). Undefined when there's no DX project (so generating outside a project doesn't
 * error) or the project doesn't set sourceApiVersion.
 */
async function getProjectApi(dir: string): Promise<string | undefined> {
  let project: SfProject;
  try {
    project = await SfProject.resolve(realExistingPath(dir));
  } catch (e) {
    return undefined;
  }
  try {
    const projectJson = await project.resolveProjectConfig();
    // sfdx-project.json isn't schema-validated on read, so a bare number (68) can arrive here.
    const v: unknown = projectJson.sourceApiVersion;
    return typeof v === 'string' || typeof v === 'number' ? String(v) : undefined;
  } catch (e) {
    return undefined;
  }
}

/**
 * Strictly parse an API version such as "68.0" or "68". Anything else (for example "latest", "0x44",
 * or "1e2") is NaN, so callers treat it as unknown and fail closed.
 */
function parseApiVersion(projApi: string | undefined): number {
  const v = projApi?.trim() ?? '';
  return /^\d+(\.\d+)?$/.test(v) ? Number(v) : NaN;
}

/** True when a project sourceApiVersion is known and below the v68.0 deploy floor. Pure; testable. */
export function isBelowApiFloor(projApi: string | undefined): boolean {
  return parseApiVersion(projApi) < 68;
}

/**
 * True when a project sourceApiVersion is known and below 69.0, where <sites> isn't deployable.
 * An unknown or unparsable version is not "below", so CLWR without a site fails closed. Pure; testable.
 */
export function isBelowSitesApi(projApi: string | undefined): boolean {
  return parseApiVersion(projApi) < SITES_API_VERSION;
}

/** Warning text for an unrecognized definition-file key (`nested` = the key came from inside `eca`). */
export function unknownKeyWarning(key: string, nested = false): string {
  return messages.getMessage('warning.unknown-definition-key', [nested ? `eca.${key}` : key]);
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

  public static readonly flags = {
    'app-name': Flags.string({ summary: messages.getMessage('flags.app-name.summary'), required: false }),
    'eca-name': Flags.string({ summary: messages.getMessage('flags.eca-name.summary'), required: false }),
    runtime: Flags.option({
      options: ['LWR_CORE', 'CLWR'] as const,
      summary: messages.getMessage('flags.runtime.summary'),
      description: messages.getMessage('flags.runtime.description'),
    })(),
    'host-domains': Flags.string({ summary: messages.getMessage('flags.host-domains.summary'), multiple: true }),
    components: Flags.string({ summary: messages.getMessage('flags.components.summary'), multiple: true }),
    'eca-contact-email': Flags.string({ summary: messages.getMessage('flags.eca-contact-email.summary') }),
    'eca-callback-url': Flags.string({ summary: messages.getMessage('flags.eca-callback-url.summary') }),
    site: Flags.string({
      summary: messages.getMessage('flags.site.summary'),
      description: messages.getMessage('flags.site.description'),
    }),
    access: Flags.option({
      options: ['guest', 'authenticated'] as const,
      summary: messages.getMessage('flags.access.summary'),
      description: messages.getMessage('flags.access.description'),
    })(),
    'definition-file': Flags.file({ exists: true, summary: messages.getMessage('flags.definition-file.summary') }),
    'output-dir': outputDirFlagLightning,
    loglevel,
  };

  public async run(): Promise<CreateOutput> {
    const { flags } = await this.parse(LightningOut);
    const defn = flags['definition-file'] ? readDefinition(flags['definition-file']) : {};
    validateDefinitionShape(defn, flags);
    const { opts, unknownKeys, unknownEcaKeys } = mergeLightningOutInputs(defn, flags);

    unknownKeys.forEach((k) => this.warn(unknownKeyWarning(k)));
    unknownEcaKeys.forEach((k) => this.warn(unknownKeyWarning(k, true)));

    const isClwr = opts.runtime === 'CLWR';
    const isGuest = isClwr && opts.access === 'guest';

    const outputDir = opts.outputdir ?? '.';
    // CLI-side sourceApiVersion check, against the project the files are generated into.
    const projApi = await getProjectApi(outputDir);

    // A CLWR app file without <sites> can unlink the app's site when deployed at 69.0+, so a site is
    // required unless the project is known to be below 69.0 (where <sites> can't be deployed and
    // Core keeps the link). Checked before generating so no files are written. A blank or empty site
    // is the generator's error, not this one.
    if (isClwr && opts.site === undefined && !isBelowSitesApi(projApi)) {
      throw projApi
        ? messages.createError('error.clwr-site-required', [projApi])
        : messages.createError('error.clwr-site-required-no-project');
    }

    const result = await runGenerator({
      templateType: TemplateType.LightningOut,
      opts,
      ux: new Ux({ jsonEnabled: this.jsonEnabled() }),
      templates: getCustomTemplates(this.configAggregator),
    });

    // Only a known version below 69.0 is certain to fail; an unknown one may deploy at the org's version.
    const siteWillFail = opts.site !== undefined && parseApiVersion(projApi) < SITES_API_VERSION;
    this.warnAfterGenerate(opts, { projApi, isGuest, siteWillFail });
    this.printGuidance(opts, { isClwr, isGuest, outputDir, siteWillFail });

    return result; // --json returns the full CreateOutput (created[])
  }

  /** Post-generate warnings (`this.warn`, so they also appear in the --json `warnings` array). */
  private warnAfterGenerate(
    opts: LightningOutOptions,
    ctx: { projApi?: string; isGuest: boolean; siteWillFail: boolean }
  ): void {
    if (opts.site === undefined && isBelowApiFloor(ctx.projApi)) {
      this.warn(messages.getMessage('warning.source-api-version', [String(ctx.projApi)]));
    }
    if (ctx.siteWillFail) {
      this.warn(messages.getMessage('warning.site-api-version', [String(ctx.projApi)]));
    }
    // Guest writes no settings files, so the org-wide settings notice applies only otherwise.
    if (!ctx.isGuest) {
      this.warn(messages.getMessage('warning.org-settings'));
    }
  }

  /** Success guidance (log/info are suppressed automatically under --json). */
  private printGuidance(
    opts: LightningOutOptions,
    ctx: { isClwr: boolean; isGuest: boolean; outputDir: string; siteWillFail: boolean }
  ): void {
    this.info(messages.getMessage('success.components-exist'));
    this.log(messages.getMessage('success.next-step', [ctx.outputDir, shellQuoteArg(ctx.outputDir)]));
    if (ctx.isClwr) {
      if (opts.site && !ctx.siteWillFail) {
        // The deploy itself links the site; the rest of the site setup is done in Experience Builder.
        const key = ctx.isGuest ? 'success.clwr-site-linked-guest' : 'success.clwr-site-linked-authenticated';
        this.info(messages.getMessage(key, [opts.site.trim()]));
      } else if (!opts.site) {
        // Below 69.0: <sites> can't be deployed, so the site is linked in Setup.
        this.info(messages.getMessage('success.clwr-site'));
      }
    } else {
      // CLWR finds the app through the site link; app-id only applies to LWR_CORE.
      this.info(messages.getMessage('success.app-id'));
    }
    if (!ctx.isGuest) {
      this.info(messages.getMessage('success.dont-delete'));
      this.info(messages.getMessage('success.eca-overwrite', [opts.eca?.name ?? '']));
    }
  }
}

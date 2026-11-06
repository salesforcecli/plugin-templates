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

/** Levenshtein distance; small inputs only (definition-file keys). */
function editDistance(a: string, b: string): number {
  const row = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    let prev = row[0];
    row[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const cur = row[j];
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = cur;
    }
  }
  return row[b.length];
}

/**
 * Suggest the known key an unrecognized key was probably meant to be: a case-insensitive match, else
 * the closest key within edit distance 2 (e.g. "sites" -> "site", "hostDomain" -> "hostDomains").
 */
export function suggestKey(key: string, known: readonly string[]): string | undefined {
  const lower = key.toLowerCase();
  const exact = known.find((k) => k.toLowerCase() === lower);
  if (exact) return exact;
  let best: { k: string; d: number } | undefined;
  for (const k of known) {
    const d = editDistance(lower, k.toLowerCase());
    if (d <= 2 && (!best || d < best.d)) best = { k, d };
  }
  return best?.k;
}

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
  requireString(flags.site !== undefined, defn.site, 'site');
  requireString(flags.access !== undefined, defn.access, 'access');

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
): { opts: LightningOutOptions; unknownKeys: string[]; unknownEcaKeys: string[] } {
  const known: ReadonlySet<string> = new Set(KNOWN_KEYS);
  const knownEca: ReadonlySet<string> = new Set(KNOWN_ECA_KEYS);
  const ecaDefn = (defn.eca ?? {}) as Record<string, unknown>;
  // Nested eca.* keys are reported too, so a typo like "eca.callbackURL" isn't silently dropped.
  const unknownKeys = Object.keys(defn).filter((k) => !known.has(k));
  const unknownEcaKeys = Object.keys(ecaDefn).filter((k) => !knownEca.has(k));
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
    // Normalize null to undefined so the `site === undefined` checks (D3, warnings) stay sound.
    site: flags.site ?? ((defn.site ?? undefined) as string | undefined),
    access: (flags.access ?? defn.access ?? undefined) as LightningOutOptions['access'],
    outputdir: flags['output-dir'],
  };
  return { opts, unknownKeys, unknownEcaKeys };
}

/**
 * Resolve `sourceApiVersion` of the DX project that contains `outputDir` (the project the files will
 * be deployed from; the generator itself has no project context). It decides whether CLWR needs a
 * site (D3) and drives the API-version warnings. Returns undefined when there's no DX project, so
 * generating outside a project doesn't error.
 */
async function getSourceApiVersion(dir: string): Promise<string | undefined> {
  try {
    const project = await SfProject.resolve(path.resolve(dir));
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

/**
 * Warning text for an unrecognized definition-file key, with a "did you mean" when one is close.
 * `nested` = the key came from inside the `eca` object (suggest among eca.* keys).
 */
export function unknownKeyWarning(key: string, nested = false): string {
  const shown = nested ? `eca.${key}` : key;
  const suggestion = suggestKey(key, nested ? KNOWN_ECA_KEYS : KNOWN_KEYS);
  return suggestion
    ? messages.getMessage('warning.unknown-definition-key-suggest', [shown, nested ? `eca.${suggestion}` : suggestion])
    : messages.getMessage('warning.unknown-definition-key', [shown]);
}

/** Names of the eca inputs a guest run ignores, as the user supplied them (flag or definition-file key). */
export function ignoredGuestEcaInputs(defn: Record<string, unknown>, flags: LightningOutFlags): string[] {
  const ecaDefn = (defn.eca ?? {}) as Record<string, unknown>;
  const pairs: Array<[keyof LightningOutFlags, string]> = [
    ['eca-name', 'name'],
    ['eca-contact-email', 'contactEmail'],
    ['eca-callback-url', 'callbackUrl'],
  ];
  const ignored: string[] = [];
  for (const [flag, key] of pairs) {
    if (flags[flag] !== undefined) ignored.push(`--${flag}`);
    else if (ecaDefn[key] !== undefined) ignored.push(`eca.${key}`);
  }
  return ignored;
}

/** Authenticated-only artifacts a guest run doesn't write but an earlier run may have left behind. */
const AUTH_ONLY_DIRS = [
  'corsWhitelistOrigins',
  'externalClientApps',
  'extlClntAppGlobalOauthSets',
  'extlClntAppOauthSettings',
];
const AUTH_ONLY_FILES = [
  path.join('settings', 'MyDomain.settings-meta.xml'),
  path.join('settings', 'Security.settings-meta.xml'),
];

/**
 * Relative paths of authenticated-only metadata files already present in an output dir.
 * Advisory only: any filesystem error is treated as "nothing found" rather than failing the command.
 */
export function findAuthOnlyFiles(outputDir: string): string[] {
  try {
    const found: string[] = [];
    for (const dir of AUTH_ONLY_DIRS) {
      const abs = path.join(outputDir, dir);
      if (fs.existsSync(abs) && fs.statSync(abs).isDirectory()) {
        for (const f of fs.readdirSync(abs).sort()) {
          if (f.endsWith('-meta.xml')) found.push(path.join(dir, f));
        }
      }
    }
    return [...found, ...AUTH_ONLY_FILES.filter((f) => fs.existsSync(path.join(outputDir, f)))];
  } catch {
    return [];
  }
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
    // CLI-side sourceApiVersion checks, against the project the files are generated into.
    const projApi = await getSourceApiVersion(outputDir);
    // `sf project deploy start` takes its version from the cwd's project, so when the cwd is a
    // different project, it must also be known to be below 69.0 before a CLWR app can omit <sites>.
    const cwdApi = path.resolve(outputDir) === process.cwd() ? projApi : await getSourceApiVersion('.');

    // A CLWR app file without <sites> can unlink the app's site when deployed at 69.0+, so a site is
    // required unless the project is known to be below 69.0 (where <sites> can't be deployed and
    // Core keeps the link). Checked before generating so no files are written. A blank or empty site
    // is the generator's error, not this one.
    if (isClwr && opts.site === undefined) {
      if (!isBelowSitesApi(projApi)) {
        throw projApi
          ? messages.createError('error.clwr-site-required', [projApi])
          : messages.createError('error.clwr-site-required-no-project');
      }
      if (cwdApi !== undefined && !isBelowSitesApi(cwdApi)) {
        throw messages.createError('error.clwr-site-required', [cwdApi]);
      }
    }

    if (isGuest) {
      const ignored = ignoredGuestEcaInputs(defn, flags);
      if (ignored.length) this.warn(messages.getMessage('warning.guest-eca-ignored', [ignored.join(', ')]));
    }

    // Snapshot before generating: a guest run never writes these, so anything found is left over.
    const staleFiles = isGuest ? findAuthOnlyFiles(outputDir) : [];

    const result = await runGenerator({
      templateType: TemplateType.LightningOut,
      opts,
      ux: new Ux({ jsonEnabled: this.jsonEnabled() }),
      templates: getCustomTemplates(this.configAggregator),
    });

    this.warnAfterGenerate(opts, { projApi, isGuest, outputDir, staleFiles });
    this.printGuidance(opts, { isClwr, isGuest, outputDir });

    return result; // --json returns the full CreateOutput (created[])
  }

  /** Post-generate warnings (`this.warn`, so they also appear in the --json `warnings` array). */
  private warnAfterGenerate(
    opts: LightningOutOptions,
    ctx: { projApi?: string; isGuest: boolean; outputDir: string; staleFiles: string[] }
  ): void {
    if (opts.site === undefined && isBelowApiFloor(ctx.projApi)) {
      this.warn(messages.getMessage('warning.source-api-version', [String(ctx.projApi)]));
    }
    if (opts.site !== undefined) {
      if (!ctx.projApi) {
        this.warn(messages.getMessage('warning.site-no-project'));
      } else if (Number.isNaN(parseApiVersion(ctx.projApi))) {
        this.warn(messages.getMessage('warning.site-unknown-version', [ctx.projApi]));
      } else if (isBelowSitesApi(ctx.projApi)) {
        this.warn(messages.getMessage('warning.site-api-version', [ctx.projApi]));
      }
    }
    if (ctx.staleFiles.length) {
      this.warn(messages.getMessage('warning.guest-stale-files', [ctx.outputDir, ctx.staleFiles.join(', ')]));
    }
    // Guest writes no settings files, so the org-wide settings notice applies only otherwise.
    if (!ctx.isGuest) {
      this.warn(messages.getMessage('warning.org-settings'));
    }
  }

  /** Success guidance (log/info are suppressed automatically under --json). */
  private printGuidance(
    opts: LightningOutOptions,
    ctx: { isClwr: boolean; isGuest: boolean; outputDir: string }
  ): void {
    this.info(messages.getMessage('success.components-exist'));
    this.log(messages.getMessage('success.next-step', [ctx.outputDir, shellQuoteArg(ctx.outputDir)]));
    if (ctx.isClwr) {
      if (opts.access === undefined) this.info(messages.getMessage('success.access-default'));
      if (opts.site) {
        // The site is linked by the deploy itself; the remaining site setup is org-side.
        this.info(messages.getMessage('success.clwr-site-linked', [opts.site.trim()]));
        this.info(messages.getMessage('success.site-relink'));
      } else {
        // Below 69.0: <sites> can't be deployed, so the site is linked in Setup.
        this.info(messages.getMessage('success.clwr-site'));
      }
      // Guests need a public site page whether the link comes from the deploy or from Setup.
      if (ctx.isGuest) this.info(messages.getMessage('success.clwr-guest-public'));
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

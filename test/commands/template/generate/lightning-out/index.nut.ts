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
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';
import { expect, config } from 'chai';
import { TestSession, execCmd } from '@salesforce/cli-plugins-testkit';
import assert from 'yeoman-assert';
import { CreateOutput } from '@salesforce/templates';

config.truncateThreshold = 0;

describe('template generate lightning-out:', () => {
  let session: TestSession;

  before(async () => {
    session = await TestSession.create({
      project: {},
      devhubAuthStrategy: 'NONE',
    });
  });
  after(async () => {
    await session?.clean();
  });

  const outDir = (name: string): string => path.join(session.project.dir, name);

  describe('happy path — 7 artifacts, no iframe artifact', () => {
    let result: CreateOutput | undefined;

    before(() => {
      result = execCmd<CreateOutput>(
        'template generate lightning-out --app-name MyLoApp --eca-name MyLoApp_ECA ' +
          '--runtime LWR_CORE --host-domains https://app.example.com --host-domains https://portal.example.com:8080 ' +
          '--components c/myButton --eca-contact-email dev@example.com ' +
          '--eca-callback-url https://app.example.com/frontdoor.html --output-dir force-app/main/default --json',
        { ensureExitCode: 0 }
      ).jsonOutput?.result;
    });

    it('should scaffold exactly the seven artifact types', () => {
      const projectOutDir = path.join(session.project.dir, 'force-app', 'main', 'default');
      assert.file([
        path.join(projectOutDir, 'lightningOutApps', 'MyLoApp.lightningOutApp-meta.xml'),
        path.join(projectOutDir, 'settings', 'MyDomain.settings-meta.xml'),
        path.join(projectOutDir, 'settings', 'Security.settings-meta.xml'),
        path.join(projectOutDir, 'corsWhitelistOrigins', 'app_example_com.corsWhitelistOrigin-meta.xml'),
        path.join(projectOutDir, 'corsWhitelistOrigins', 'portal_example_com_8080.corsWhitelistOrigin-meta.xml'),
        path.join(projectOutDir, 'externalClientApps', 'MyLoApp_ECA.eca-meta.xml'),
        path.join(projectOutDir, 'extlClntAppGlobalOauthSets', 'MyLoApp_ECA.ecaGlblOauth-meta.xml'),
        path.join(projectOutDir, 'extlClntAppOauthSettings', 'MyLoApp_ECA.ecaOauth-meta.xml'),
      ]);
      expect(fs.existsSync(path.join(projectOutDir, 'iframeWhiteListUrlSettings'))).to.be.false;
    });

    it('should render the input values into the generated metadata (not just create the files)', () => {
      const projectOutDir = path.join(session.project.dir, 'force-app', 'main', 'default');

      const loApp = fs.readFileSync(
        path.join(projectOutDir, 'lightningOutApps', 'MyLoApp.lightningOutApp-meta.xml'),
        'utf8'
      );
      expect(loApp).to.include('<runtime>LWR_CORE</runtime>');
      expect(loApp).to.include('<componentName>c/myButton</componentName>');
      expect(loApp).to.include('<hostDomain>https://app.example.com</hostDomain>');
      expect(loApp).to.include('<hostDomain>https://portal.example.com:8080</hostDomain>');

      // contactEmail lives only in the ExternalClientApplication artifact.
      const eca = fs.readFileSync(path.join(projectOutDir, 'externalClientApps', 'MyLoApp_ECA.eca-meta.xml'), 'utf8');
      expect(eca).to.include('dev@example.com');

      // callbackUrl lives only in the ExtlClntAppGlobalOauthSettings artifact.
      const ecaGlobalOauth = fs.readFileSync(
        path.join(projectOutDir, 'extlClntAppGlobalOauthSets', 'MyLoApp_ECA.ecaGlblOauth-meta.xml'),
        'utf8'
      );
      expect(ecaGlobalOauth).to.include('https://app.example.com/frontdoor.html');
    });

    it('should return a CreateOutput with non-empty created[]', () => {
      assert(result);
      expect(result.created).to.be.an('array').that.is.not.empty;
    });
  });

  describe('--definition-file', () => {
    let defFile: string;

    before(() => {
      defFile = path.join(session.project.dir, 'lo-def.json');
      fs.writeFileSync(
        defFile,
        JSON.stringify({
          appName: 'DefApp',
          runtime: 'LWR_CORE',
          hostDomains: ['https://app.example.com'],
          components: ['c/myButton'],
          eca: { name: 'DefApp_ECA', contactEmail: 'dev@example.com', callbackUrl: 'https://app.example.com/cb' },
        })
      );
    });

    it('should generate the app + ECA files with the names from the definition file', () => {
      const dir = outDir('def-plain');
      execCmd(`template generate lightning-out --definition-file ${defFile} --output-dir ${dir} --json`, {
        ensureExitCode: 0,
      });
      assert.file([
        path.join(dir, 'lightningOutApps', 'DefApp.lightningOutApp-meta.xml'),
        path.join(dir, 'externalClientApps', 'DefApp_ECA.eca-meta.xml'),
      ]);
    });

    it('should let --app-name override the definition file appName', () => {
      const dir = outDir('def-override');
      execCmd(
        `template generate lightning-out --definition-file ${defFile} --app-name OverrideApp --output-dir ${dir} --json`,
        { ensureExitCode: 0 }
      );
      assert.file(path.join(dir, 'lightningOutApps', 'OverrideApp.lightningOutApp-meta.xml'));
    });
  });

  describe('validation failure', () => {
    it('should exit non-zero with a message naming the invalid host-domain scheme', () => {
      const dir = outDir('bad-host-domain');
      // The generator accepts both http and https origins; only a non-http(s) scheme is rejected.
      const stderr = execCmd(
        'template generate lightning-out --app-name BadHostApp --eca-name BadHostApp_ECA --runtime LWR_CORE ' +
          `--host-domains ftp://app.example.com --components c/myButton --eca-contact-email dev@example.com --eca-callback-url https://app.example.com/cb --output-dir ${dir}`,
        { ensureExitCode: 1 }
      ).shellOutput.stderr;
      expect(stderr).to.match(/host domain/i);
      expect(stderr).to.match(/http or https/i);
    });
  });

  describe('sourceApiVersion floor guidance in the deploy suggestion', () => {
    const projectJsonPath = (): string => path.join(session.project.dir, 'sfdx-project.json');

    const setSourceApiVersion = (version: string): void => {
      const cfg = JSON.parse(fs.readFileSync(projectJsonPath(), 'utf8')) as Record<string, unknown>;
      cfg.sourceApiVersion = version;
      fs.writeFileSync(projectJsonPath(), JSON.stringify(cfg, null, 2));
    };

    // Run without --json so the this.log/this.warn guidance is actually emitted.
    const runNoJson = (dir: string): { stdout: string; stderr: string } =>
      execCmd(
        'template generate lightning-out --app-name FloorApp --eca-name FloorApp_ECA --runtime LWR_CORE ' +
          `--host-domains https://app.example.com --components c/myButton --eca-contact-email dev@example.com ` +
          `--eca-callback-url https://app.example.com/cb --output-dir ${dir}`,
        { ensureExitCode: 0 }
      ).shellOutput;

    it('warns (without an --api-version pin) when sourceApiVersion is below the floor', () => {
      setSourceApiVersion('64.0');
      const { stdout, stderr } = runNoJson(outDir('floor-below'));
      expect(stderr).to.match(/is below 68\.0/); // floor warning fired
      expect(stdout).to.include('sf project deploy start');
      expect(stdout).to.not.include('--api-version');
    });

    it('omits --api-version (lets the project default win) when sourceApiVersion is at or above the floor', () => {
      setSourceApiVersion('70.0');
      const { stdout, stderr } = runNoJson(outDir('floor-above'));
      expect(stderr).to.not.match(/is below 68\.0/); // no floor warning
      expect(stdout).to.include('sf project deploy start');
      expect(stdout).to.not.include('--api-version');
    });
  });

  // End-to-end through the real generator (the unit tests stub it).
  describe('CLWR site and access', () => {
    const projectJsonPath = (): string => path.join(session.project.dir, 'sfdx-project.json');
    const setSourceApiVersion = (version: string): void => {
      const cfg = JSON.parse(fs.readFileSync(projectJsonPath(), 'utf8')) as Record<string, unknown>;
      cfg.sourceApiVersion = version;
      fs.writeFileSync(projectJsonPath(), JSON.stringify(cfg, null, 2));
    };
    /** Whitespace-normalized so terminal wrapping can't break a match. */
    const flat = (s: string): string => s.replace(/\s+/g, ' ');
    const listFiles = (dir: string): string[] =>
      (fs.readdirSync(dir, { recursive: true }) as string[])
        .filter((f) => fs.statSync(path.join(dir, f)).isFile())
        .sort();
    const appXml = (dir: string, name = 'SiteApp'): string =>
      fs.readFileSync(path.join(dir, 'lightningOutApps', `${name}.lightningOutApp-meta.xml`), 'utf8');
    const auth =
      '--eca-name SiteApp_ECA --host-domains https://app.example.com --eca-contact-email dev@example.com ' +
      '--eca-callback-url https://app.example.com/cb';
    const appFile = path.join('lightningOutApps', 'SiteApp.lightningOutApp-meta.xml');

    it('guest + site at 69.0: only the app file, <sites> last, no allowedDomains, created[] has 1 entry', () => {
      setSourceApiVersion('69.0');
      const dir = outDir('site-guest');
      const result = execCmd<CreateOutput>(
        `template generate lightning-out --app-name SiteApp --runtime CLWR --access guest --site "My Site" --components c/myButton --output-dir ${dir} --json`,
        { ensureExitCode: 0 }
      ).jsonOutput?.result;
      expect(listFiles(dir)).to.deep.equal([appFile]);
      expect(result?.created).to.have.length(1);
      const xml = appXml(dir);
      expect(xml).to.not.include('<allowedDomains>');
      expect(xml).to.match(
        /<\/components>\n {4}<sites>\n {8}<siteName>My Site<\/siteName>\n {4}<\/sites>\n<\/LightningOutApp>\n$/
      );
    });

    it('authenticated + site at 69.0: full 7-file set, <sites> after allowedDomains, no --api-version pin', () => {
      setSourceApiVersion('69.0');
      const dir = outDir('site-auth');
      const { stdout } = execCmd(
        `template generate lightning-out --app-name SiteApp --runtime CLWR --site my_site ${auth} --output-dir ${dir}`,
        { ensureExitCode: 0 }
      ).shellOutput;
      expect(listFiles(dir)).to.have.length(7);
      expect(appXml(dir)).to.include('</allowedDomains>\n    <sites>\n        <siteName>my_site</siteName>');
      expect(stdout).to.include('sf project deploy start');
      expect(stdout).to.not.include('--api-version');
      expect(flat(stdout)).to.include('links it to the "my_site" Experience Cloud site');
    });

    it('CLWR without a site at 69.0: exits 1 with the site-required error and writes nothing', () => {
      setSourceApiVersion('69.0');
      const dir = outDir('site-required');
      const { stderr } = execCmd(
        `template generate lightning-out --app-name SiteApp --runtime CLWR ${auth} --output-dir ${dir}`,
        { ensureExitCode: 1 }
      ).shellOutput;
      expect(flat(stderr)).to.include('A CLWR app needs a site');
      expect(fs.existsSync(dir)).to.equal(false);
    });

    it('CLWR without a site at 66.0: allowed, no pin, prints the Setup link guidance', () => {
      setSourceApiVersion('66.0');
      const dir = outDir('site-legacy');
      const { stdout } = execCmd(
        `template generate lightning-out --app-name SiteApp --runtime CLWR ${auth} --output-dir ${dir}`,
        { ensureExitCode: 0 }
      ).shellOutput;
      expect(appXml(dir)).to.not.include('<sites>');
      expect(stdout).to.not.include('--api-version');
      expect(flat(stdout)).to.include('Link the app to your Experience Cloud site after deploying');
    });

    it('site at 66.0: no pin, warns about the site API version, not the 68.0 floor', () => {
      setSourceApiVersion('66.0');
      const dir = outDir('site-pin');
      const { stdout, stderr } = execCmd(
        `template generate lightning-out --app-name SiteApp --runtime CLWR --access guest --site S --output-dir ${dir}`,
        { ensureExitCode: 0 }
      ).shellOutput;
      expect(stdout).to.not.include('--api-version');
      expect(flat(stderr)).to.include('Linking a site requires API version 69.0 or later');
      expect(stderr).to.not.match(/is below 68\.0/);
    });

    it('LWR_CORE with --site or --access: exits 1, CLWR-only error, writes nothing', () => {
      setSourceApiVersion('69.0');
      for (const extra of ['--site S', '--access guest']) {
        const dir = outDir(`lwr-${extra.slice(2, 6)}`);
        const { stderr } = execCmd(
          `template generate lightning-out --app-name SiteApp --runtime LWR_CORE ${extra} ${auth} --output-dir ${dir}`,
          { ensureExitCode: 1 }
        ).shellOutput;
        expect(flat(stderr)).to.match(/(site|access) applies only to runtime CLWR/);
        expect(fs.existsSync(dir)).to.equal(false);
      }
    });

    it('LWR_CORE at 69.0 output has no <sites> (unchanged behaviour)', () => {
      setSourceApiVersion('69.0');
      const dir = outDir('lwr-unchanged');
      execCmd(`template generate lightning-out --app-name SiteApp --runtime LWR_CORE ${auth} --output-dir ${dir}`, {
        ensureExitCode: 0,
      });
      expect(listFiles(dir)).to.have.length(7);
      expect(appXml(dir)).to.not.include('<sites>');
    });

    it('rejects an invalid --access value at the flag layer', () => {
      const { stderr } = execCmd(
        `template generate lightning-out --app-name SiteApp --runtime CLWR --access public --site S --output-dir ${outDir(
          'bad-access'
        )}`,
        { ensureExitCode: 2 }
      ).shellOutput;
      expect(stderr).to.match(/guest, authenticated/);
    });

    it('definition file supplies site/access; --site overrides it; an unrecognized key warns', () => {
      setSourceApiVersion('69.0');
      const def = path.join(session.project.dir, 'lo-site-def.json');
      fs.writeFileSync(
        def,
        JSON.stringify({ appName: 'SiteApp', runtime: 'CLWR', access: 'guest', site: 'FileSite', acess: 'x' })
      );
      const fromFile = outDir('def-site');
      const { stderr } = execCmd(`template generate lightning-out --definition-file ${def} --output-dir ${fromFile}`, {
        ensureExitCode: 0,
      }).shellOutput;
      expect(listFiles(fromFile)).to.deep.equal([appFile]);
      expect(appXml(fromFile)).to.include('<siteName>FileSite</siteName>');
      expect(flat(stderr)).to.include('Ignoring unrecognized key "acess" in --definition-file.');

      const overridden = outDir('def-site-override');
      execCmd(`template generate lightning-out --definition-file ${def} --site FlagSite --output-dir ${overridden}`, {
        ensureExitCode: 0,
      });
      expect(appXml(overridden)).to.include('<siteName>FlagSite</siteName>');
    });

    it('guest: warns about ignored eca flags and about authenticated-only files from an earlier run', () => {
      setSourceApiVersion('69.0');
      const dir = outDir('guest-stale');
      execCmd(
        `template generate lightning-out --app-name SiteApp --runtime CLWR --site S ${auth} --output-dir ${dir}`,
        {
          ensureExitCode: 0,
        }
      );
      const { stderr } = execCmd(
        `template generate lightning-out --app-name SiteApp --runtime CLWR --access guest --site S --eca-name X --output-dir ${dir}`,
        { ensureExitCode: 0 }
      ).shellOutput;
      const err = flat(stderr);
      expect(err).to.include('these inputs are ignored: --eca-name');
      expect(err).to.include("Guest access doesn't need them");
      expect(err).to.include(path.join('externalClientApps', 'SiteApp_ECA.eca-meta.xml'));
    });

    it('rejects a blank or control-character site name from the generator', () => {
      setSourceApiVersion('69.0');
      const def = path.join(session.project.dir, 'lo-bad-site.json');
      for (const site of ['   ', 'a\nb']) {
        fs.writeFileSync(def, JSON.stringify({ appName: 'SiteApp', runtime: 'CLWR', access: 'guest', site }));
        const { stderr } = execCmd(
          `template generate lightning-out --definition-file ${def} --output-dir ${outDir('bad-site')}`,
          { ensureExitCode: 1 }
        ).shellOutput;
        expect(flat(stderr)).to.include('site must be a non-empty Experience site name');
      }
    });

    describe('--json contract', () => {
      const orgSettingsText = 'Deploying the generated MyDomain and Security settings changes two org-wide settings';

      it('guest + site: created has 1 entry, no org-settings warning, stdout is JSON only', () => {
        setSourceApiVersion('69.0');
        const out = execCmd<CreateOutput>(
          `template generate lightning-out --app-name SiteApp --runtime CLWR --access guest --site S --components c/myButton --output-dir ${outDir(
            'json-guest'
          )} --json`,
          { ensureExitCode: 0 }
        );
        expect(out.jsonOutput?.result.created).to.have.length(1);
        const warnings = out.jsonOutput?.warnings ?? [];
        expect(flat(warnings.join(' '))).to.not.include(orgSettingsText);
        const parsed = JSON.parse(out.shellOutput.stdout) as { status: number };
        expect(parsed.status).to.equal(0);
        expect(out.shellOutput.stdout).to.not.include('Scaffold generated in');
      });

      it('authenticated + site: created has 7 entries and the org-settings warning is present', () => {
        setSourceApiVersion('69.0');
        const out = execCmd<CreateOutput>(
          `template generate lightning-out --app-name SiteApp --runtime CLWR --site S ${auth} --output-dir ${outDir(
            'json-auth'
          )} --json`,
          { ensureExitCode: 0 }
        );
        expect(out.jsonOutput?.result.created).to.have.length(7);
        const warnings = out.jsonOutput?.warnings ?? [];
        expect(flat(warnings.join(' '))).to.include(orgSettingsText);
        expect(() => {
          JSON.parse(out.shellOutput.stdout);
        }).to.not.throw();
      });

      it('carries site-api-version, guest-eca-ignored and guest-stale-files warnings', () => {
        setSourceApiVersion('66.0');
        const dir = outDir('json-warn');
        execCmd(
          `template generate lightning-out --app-name SiteApp --runtime CLWR --site S ${auth} --output-dir ${dir}`,
          {
            ensureExitCode: 0,
          }
        );
        const out = execCmd(
          `template generate lightning-out --app-name SiteApp --runtime CLWR --access guest --site S --eca-name X --output-dir ${dir} --json`,
          { ensureExitCode: 0 }
        );
        const all = flat((out.jsonOutput?.warnings ?? []).join(' | '));
        expect(all).to.include('Linking a site requires API version 69.0 or later');
        expect(all).to.include('these inputs are ignored: --eca-name');
        expect(all).to.include("Guest access doesn't need them");
        expect(all).to.include(path.join('externalClientApps', 'SiteApp_ECA.eca-meta.xml'));
      });

      it('carries unknown-key warnings and eca.name in guest-eca-ignored', () => {
        setSourceApiVersion('69.0');
        const def = path.join(session.project.dir, 'lo-json-keys.json');
        fs.writeFileSync(
          def,
          JSON.stringify({
            appName: 'SiteApp',
            runtime: 'CLWR',
            access: 'guest',
            site: 'S',
            sites: ['S'],
            eca: { name: 'E', scopes: 'x' },
          })
        );
        const out = execCmd(
          `template generate lightning-out --definition-file ${def} --output-dir ${outDir('json-keys')} --json`,
          { ensureExitCode: 0 }
        );
        const all = flat((out.jsonOutput?.warnings ?? []).join(' | '));
        expect(all).to.include('Ignoring unrecognized key "sites" in --definition-file.');
        expect(all).to.include('Ignoring unrecognized key "eca.scopes" in --definition-file.');
        expect(all).to.include('these inputs are ignored: eca.name');
      });
    });

    describe('--json error envelope', () => {
      for (const [label, extra] of [
        ['CLWR', ''],
        ['guest', '--access guest'],
      ]) {
        it(`${label} without a site at 69.0: exit 1, Clwr-site-requiredError naming 69.0`, () => {
          setSourceApiVersion('69.0');
          const dir = outDir(`json-nosite-${label}`);
          const out = execCmd(
            `template generate lightning-out --app-name SiteApp --runtime CLWR ${extra} ${auth} --output-dir ${dir} --json`,
            { ensureExitCode: 1 }
          );
          expect(out.jsonOutput?.name).to.equal('Clwr-site-requiredError');
          expect(out.jsonOutput?.message).to.include('69.0');
          expect(fs.existsSync(dir)).to.equal(false);
        });
      }
    });

    describe('outside a DX project', () => {
      let cwd: string;
      before(() => {
        cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'lo-noproj-'));
      });
      after(() => {
        fs.rmSync(cwd, { recursive: true, force: true });
      });

      it('CLWR without a site: exit 1 with Clwr-site-required-no-projectError', () => {
        const out = execCmd(
          `template generate lightning-out --app-name SiteApp --runtime CLWR ${auth} --output-dir out-nosite --json`,
          { ensureExitCode: 1, cwd }
        );
        expect(out.jsonOutput?.name).to.equal('Clwr-site-required-no-projectError');
        expect(fs.existsSync(path.join(cwd, 'out-nosite'))).to.equal(false);
      });

      it('--site: exit 0, no --api-version in the deploy command, site-no-project warning on stderr', () => {
        const { stdout, stderr } = execCmd(
          'template generate lightning-out --app-name SiteApp --runtime CLWR --access guest --site S --output-dir out-site',
          { ensureExitCode: 0, cwd }
        ).shellOutput;
        expect(stdout).to.include('sf project deploy start');
        expect(stdout).to.not.include('--api-version');
        expect(flat(stderr)).to.include(
          'Linking a site requires API version 69.0 or later. No sourceApiVersion was found'
        );
        expect(fs.existsSync(path.join(cwd, 'out-site', appFile))).to.equal(true);
      });
    });

    it('guest at 69.0 (non-json): prints site-linked, relink and guest-public guidance, not the ECA notes', () => {
      setSourceApiVersion('69.0');
      const { stdout, stderr } = execCmd(
        `template generate lightning-out --app-name SiteApp --runtime CLWR --access guest --site S --output-dir ${outDir(
          'guest-guidance'
        )}`,
        { ensureExitCode: 0 }
      ).shellOutput;
      // Empirically, this.info() writes to stdout (not stderr) in a non-TTY child process.
      const out = flat(stdout);
      expect(out).to.include('links it to the "S" Experience Cloud site');
      expect(out).to.include('An app can link to only one site');
      expect(out).to.include('make the site page that serves the app public');
      const both = flat(`${stdout} ${stderr}`);
      expect(both).to.not.include("Don't delete the generated External Client Application");
      expect(both).to.not.include('Re-running this command overwrites');
    });

    it('regenerate risk: LWR_CORE into a dir holding an authenticated CLWR+site app replaces <sites>', () => {
      setSourceApiVersion('69.0');
      const dir = outDir('regen');
      execCmd(
        `template generate lightning-out --app-name SiteApp --runtime CLWR --site S ${auth} --output-dir ${dir}`,
        {
          ensureExitCode: 0,
        }
      );
      expect(appXml(dir)).to.include('<sites>');
      execCmd(`template generate lightning-out --app-name SiteApp --runtime LWR_CORE ${auth} --output-dir ${dir}`, {
        ensureExitCode: 0,
      });
      const xml = appXml(dir);
      expect(xml).to.include('<runtime>LWR_CORE</runtime>');
      expect(xml).to.not.include('<sites>');
    });

    it('trims surrounding whitespace in --site', () => {
      setSourceApiVersion('69.0');
      const dir = outDir('site-trim');
      execCmd(
        `template generate lightning-out --app-name SiteApp --runtime CLWR --access guest --site "  S  " --output-dir ${dir}`,
        { ensureExitCode: 0 }
      );
      expect(appXml(dir)).to.include('<siteName>S</siteName>');
    });

    it('rejects an empty --site and writes nothing', () => {
      setSourceApiVersion('69.0');
      const dir = outDir('site-empty');
      const { stderr } = execCmd(
        `template generate lightning-out --app-name SiteApp --runtime CLWR --access guest --site "" --output-dir ${dir}`,
        { ensureExitCode: 1 }
      ).shellOutput;
      expect(flat(stderr)).to.include('site must be a non-empty');
      expect(fs.existsSync(dir)).to.equal(false);
    });

    it('rejects a lowercase --runtime at the flag layer (exit 2)', () => {
      setSourceApiVersion('69.0');
      const { stderr } = execCmd(
        `template generate lightning-out --app-name SiteApp --runtime clwr --site S --output-dir ${outDir('rt-lower')}`,
        { ensureExitCode: 2 }
      ).shellOutput;
      expect(stderr).to.include('Expected --runtime=clwr to be one of: LWR_CORE, CLWR');
    });

    it('rejects a repeated --site at the flag layer (exit 2), writing nothing', () => {
      setSourceApiVersion('69.0');
      const dir = outDir('site-twice');
      const { stderr } = execCmd(
        `template generate lightning-out --app-name SiteApp --runtime CLWR --access guest --site A --site B --output-dir ${dir}`,
        { ensureExitCode: 2 }
      ).shellOutput;
      expect(stderr).to.include('Flag --site can only be specified once');
      expect(fs.existsSync(dir)).to.equal(false);
    });
  });
});

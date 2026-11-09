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
  const setSourceApiVersion = (version: string): void => {
    const file = path.join(session.project.dir, 'sfdx-project.json');
    const cfg = JSON.parse(fs.readFileSync(file, 'utf8')) as Record<string, unknown>;
    cfg.sourceApiVersion = version;
    fs.writeFileSync(file, JSON.stringify(cfg, null, 2));
  };
  /** Whitespace-normalized so terminal wrapping can't break a match. */
  const flat = (s: string): string => s.replace(/\s+/g, ' ');
  const listFiles = (dir: string): string[] =>
    (fs.readdirSync(dir, { recursive: true }) as string[]).filter((f) => fs.statSync(path.join(dir, f)).isFile());
  const appXml = (dir: string): string =>
    fs.readFileSync(path.join(dir, 'lightningOutApps', 'SiteApp.lightningOutApp-meta.xml'), 'utf8');
  const auth =
    '--eca-name SiteApp_ECA --host-domains https://app.example.com --eca-contact-email dev@example.com ' +
    '--eca-callback-url https://app.example.com/cb';

  describe('LWR_CORE', () => {
    let result: CreateOutput | undefined;
    const dir = (): string => path.join(session.project.dir, 'force-app', 'main', 'default');

    before(() => {
      result = execCmd<CreateOutput>(
        'template generate lightning-out --app-name MyLoApp --eca-name MyLoApp_ECA ' +
          '--runtime LWR_CORE --host-domains https://app.example.com --host-domains https://portal.example.com:8080 ' +
          '--components c/myButton --eca-contact-email dev@example.com ' +
          '--eca-callback-url https://app.example.com/frontdoor.html --output-dir force-app/main/default --json',
        { ensureExitCode: 0 }
      ).jsonOutput?.result;
    });

    it('should scaffold the seven artifact types and return created[] in the JSON output', () => {
      assert.file([
        path.join(dir(), 'lightningOutApps', 'MyLoApp.lightningOutApp-meta.xml'),
        path.join(dir(), 'settings', 'MyDomain.settings-meta.xml'),
        path.join(dir(), 'settings', 'Security.settings-meta.xml'),
        path.join(dir(), 'corsWhitelistOrigins', 'app_example_com.corsWhitelistOrigin-meta.xml'),
        path.join(dir(), 'corsWhitelistOrigins', 'portal_example_com_8080.corsWhitelistOrigin-meta.xml'),
        path.join(dir(), 'externalClientApps', 'MyLoApp_ECA.eca-meta.xml'),
        path.join(dir(), 'extlClntAppGlobalOauthSets', 'MyLoApp_ECA.ecaGlblOauth-meta.xml'),
        path.join(dir(), 'extlClntAppOauthSettings', 'MyLoApp_ECA.ecaOauth-meta.xml'),
      ]);
      expect(fs.existsSync(path.join(dir(), 'iframeWhiteListUrlSettings'))).to.be.false;
      assert(result);
      expect(result.created).to.be.an('array').that.is.not.empty;
    });

    it('should render the input values into the generated metadata', () => {
      const loApp = fs.readFileSync(path.join(dir(), 'lightningOutApps', 'MyLoApp.lightningOutApp-meta.xml'), 'utf8');
      expect(loApp).to.include('<runtime>LWR_CORE</runtime>');
      expect(loApp).to.include('<componentName>c/myButton</componentName>');
      expect(loApp).to.include('<hostDomain>https://portal.example.com:8080</hostDomain>');
      const eca = fs.readFileSync(path.join(dir(), 'externalClientApps', 'MyLoApp_ECA.eca-meta.xml'), 'utf8');
      expect(eca).to.include('dev@example.com');
    });

    it('should exit non-zero with a message naming an invalid host-domain scheme', () => {
      const stderr = execCmd(
        'template generate lightning-out --app-name BadHostApp --eca-name BadHostApp_ECA --runtime LWR_CORE ' +
          `--host-domains ftp://app.example.com --components c/myButton --eca-contact-email dev@example.com --eca-callback-url https://app.example.com/cb --output-dir ${outDir(
            'bad-host-domain'
          )}`,
        { ensureExitCode: 1 }
      ).shellOutput.stderr;
      expect(stderr).to.match(/http or https/i);
    });
  });

  // End-to-end through the real generator (the unit tests stub it).
  describe('CLWR site and access', () => {
    it('authenticated + site at 69.0: full 7-file set, <sites> after allowedDomains, authenticated guidance', () => {
      setSourceApiVersion('69.0');
      const dir = outDir('site-auth');
      const { stdout } = execCmd(
        `template generate lightning-out --app-name SiteApp --runtime CLWR --site my_site ${auth} --output-dir ${dir}`,
        { ensureExitCode: 0 }
      ).shellOutput;
      expect(listFiles(dir)).to.have.length(7);
      expect(appXml(dir)).to.include('</allowedDomains>\n    <sites>\n        <siteName>my_site</siteName>');
      expect(stdout).to.not.include('--api-version');
      expect(flat(stdout)).to.include('links it to the "my_site" site').and.to.include('frontdoor-url');
    });

    it('guest + site at 69.0: only the app file, no allowedDomains, guest guidance', () => {
      setSourceApiVersion('69.0');
      const dir = outDir('site-guest');
      const { stdout, stderr } = execCmd(
        `template generate lightning-out --app-name SiteApp --runtime CLWR --access guest --site "My Site" --output-dir ${dir}`,
        { ensureExitCode: 0 }
      ).shellOutput;
      expect(listFiles(dir)).to.deep.equal([path.join('lightningOutApps', 'SiteApp.lightningOutApp-meta.xml')]);
      expect(appXml(dir)).to.not.include('<allowedDomains>');
      expect(appXml(dir)).to.include('<siteName>My Site</siteName>');
      expect(flat(stdout)).to.include('make the page that serves the app public').and.to.include('org-url');
      expect(flat(`${stdout} ${stderr}`)).to.not.include("Don't delete the generated External Client Application");
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

    it('definition file with "site": null is treated as absent (allowed below 69.0, no <sites>)', () => {
      setSourceApiVersion('66.0');
      const def = path.join(session.project.dir, 'lo-null-site.json');
      fs.writeFileSync(def, JSON.stringify({ appName: 'SiteApp', runtime: 'CLWR', access: 'guest', site: null }));
      const dir = outDir('def-null-site');
      execCmd(`template generate lightning-out --definition-file ${def} --output-dir ${dir}`, { ensureExitCode: 0 });
      expect(appXml(dir)).to.not.include('<sites>');
    });

    it('--site below 69.0: one site-version warning, no linked guidance, JSON warnings carry it', () => {
      setSourceApiVersion('66.0');
      const out = execCmd(
        `template generate lightning-out --app-name SiteApp --runtime CLWR --access guest --site S --output-dir ${outDir(
          'site-old'
        )} --json`,
        { ensureExitCode: 0 }
      );
      const warnings = flat((out.jsonOutput?.warnings ?? []).join(' | '));
      expect(warnings).to.include('Linking a site requires sourceApiVersion 69.0 or later');
      expect(out.shellOutput.stdout).to.not.include('links it to the');
      expect(() => {
        JSON.parse(out.shellOutput.stdout);
      }).to.not.throw();
    });
  });
});

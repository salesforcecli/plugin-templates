/*
 * Copyright (c) 2026, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import path from 'node:path';
import fs from 'node:fs';
import { expect, config } from 'chai';
import { TestSession, execCmd } from '@salesforce/cli-plugins-testkit';
import assert from 'yeoman-assert';

config.truncateThreshold = 0;

describe('template generate lightning-out:', () => {
  let session: TestSession;
  let defFile: string;

  before(async () => {
    session = await TestSession.create({
      project: {},
      devhubAuthStrategy: 'NONE',
    });
    defFile = path.join(session.project.dir, 'lo-def.json');
    fs.writeFileSync(
      defFile,
      JSON.stringify({
        name: 'MyLoApp',
        runtime: 'LWR_CORE',
        components: ['c-my-button', 'c-my-card'],
        hostDomains: ['https://app.example.com', 'https://portal.example.com'],
        eca: { contactEmail: 'dev@example.com', distributionState: 'Local', oauthScopes: ['Web', 'Api'] },
      })
    );
  });
  after(async () => {
    await session?.clean();
  });

  const outDir = (name: string): string => path.join(session.project.dir, name);

  const allArtifacts = (dir: string): string[] => [
    path.join(dir, 'lightningOutApps', 'MyLoApp.lightningOutApp-meta.xml'),
    path.join(dir, 'iframeWhiteListUrlSettings', 'IframeWhiteListUrlSettings.iframeWhiteListUrlSettings-meta.xml'),
    path.join(dir, 'settings', 'MyDomain.settings-meta.xml'),
    path.join(dir, 'settings', 'Security.settings-meta.xml'),
    path.join(dir, 'corsWhitelistOrigins', 'app_example_com.corsWhitelistOrigin-meta.xml'),
    path.join(dir, 'corsWhitelistOrigins', 'portal_example_com.corsWhitelistOrigin-meta.xml'),
    path.join(dir, 'externalClientApps', 'MyLoApp.eca-meta.xml'),
    path.join(dir, 'extlClntAppGlobalOauthSets', 'MyLoApp.ecaGlblOauth-meta.xml'),
    path.join(dir, 'extlClntAppOauthSettings', 'MyLoApp.ecaOauth-meta.xml'),
  ];

  describe('generation', () => {
    it('should scaffold all nine metadata artifacts', () => {
      const dir = outDir('gen-all');
      execCmd(`template generate lightning-out --definition-file ${defFile} --output-dir ${dir}`, {
        ensureExitCode: 0,
      });
      assert.file(allArtifacts(dir));
    });

    it('should render app name, runtime, and components into the LightningOutApp', () => {
      const dir = outDir('gen-app');
      execCmd(`template generate lightning-out --definition-file ${defFile} --output-dir ${dir}`, {
        ensureExitCode: 0,
      });
      const app = path.join(dir, 'lightningOutApps', 'MyLoApp.lightningOutApp-meta.xml');
      assert.fileContent(app, '<applicationName>MyLoApp</applicationName>');
      assert.fileContent(app, '<runtime>LWR_CORE</runtime>');
      assert.fileContent(app, 'c-my-button');
      assert.fileContent(app, 'c-my-card');
    });

    it('should list this app host domains under LightningOut context in the iframe artifact', () => {
      const dir = outDir('gen-iframe');
      execCmd(`template generate lightning-out --definition-file ${defFile} --output-dir ${dir}`, {
        ensureExitCode: 0,
      });
      const iframe = path.join(
        dir,
        'iframeWhiteListUrlSettings',
        'IframeWhiteListUrlSettings.iframeWhiteListUrlSettings-meta.xml'
      );
      assert.fileContent(iframe, '<url>https://app.example.com</url>');
      assert.fileContent(iframe, '<url>https://portal.example.com</url>');
      assert.fileContent(iframe, '<context>LightningOut</context>');
    });

    it('should warn about the REPLACE risk when not merging', () => {
      const dir = outDir('gen-warn');
      const result = execCmd(`template generate lightning-out --definition-file ${defFile} --output-dir ${dir}`, {
        ensureExitCode: 0,
      });
      expect(result.shellOutput.stderr).to.match(/REPLACES your org's entire/i);
    });
  });

  describe('Option A — no silent overwrite', () => {
    it('should fail on a second run without --force', () => {
      const dir = outDir('gen-guard');
      execCmd(`template generate lightning-out --definition-file ${defFile} --output-dir ${dir}`, {
        ensureExitCode: 0,
      });
      const stderr = execCmd(`template generate lightning-out --definition-file ${defFile} --output-dir ${dir}`, {
        ensureExitCode: 'nonZero',
      }).shellOutput.stderr;
      expect(stderr).to.match(/already exist/i);
    });

    it('should overwrite on a second run with --force', () => {
      const dir = outDir('gen-force');
      execCmd(`template generate lightning-out --definition-file ${defFile} --output-dir ${dir}`, {
        ensureExitCode: 0,
      });
      execCmd(`template generate lightning-out --definition-file ${defFile} --output-dir ${dir} --force`, {
        ensureExitCode: 0,
      });
      assert.file(allArtifacts(dir));
    });
  });

  describe('failures', () => {
    it('should error when --definition-file is missing', () => {
      const stderr = execCmd('template generate lightning-out').shellOutput.stderr;
      expect(stderr).to.contain('Missing required flag');
    });

    it('should error when --definition-file does not exist', () => {
      const stderr = execCmd(
        `template generate lightning-out --definition-file ${path.join(session.project.dir, 'nope.json')}`
      ).shellOutput.stderr;
      expect(stderr).to.match(/No file found|does not exist|cannot find/i);
    });

    it('should error on an invalid definition (bad runtime)', () => {
      const bad = path.join(session.project.dir, 'bad-runtime.json');
      fs.writeFileSync(
        bad,
        JSON.stringify({
          name: 'BadApp',
          runtime: 'NOPE',
          components: ['c-x'],
          hostDomains: ['https://app.example.com'],
          eca: { contactEmail: 'dev@example.com' },
        })
      );
      const stderr = execCmd(
        `template generate lightning-out --definition-file ${bad} --output-dir ${outDir('bad-runtime')}`,
        { ensureExitCode: 'nonZero' }
      ).shellOutput.stderr;
      expect(stderr).to.match(/runtime/i);
    });

    it('should error on malformed JSON', () => {
      const bad = path.join(session.project.dir, 'bad-json.json');
      fs.writeFileSync(bad, '{ not valid json ');
      const stderr = execCmd(
        `template generate lightning-out --definition-file ${bad} --output-dir ${outDir('bad-json')}`,
        { ensureExitCode: 'nonZero' }
      ).shellOutput.stderr;
      expect(stderr).to.match(/not valid JSON/i);
    });
  });
});

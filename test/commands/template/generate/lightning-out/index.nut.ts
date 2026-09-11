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
    it('should exit non-zero with a message naming the invalid host domain', () => {
      const dir = outDir('bad-host-domain');
      const stderr = execCmd(
        'template generate lightning-out --app-name BadHostApp --eca-name BadHostApp_ECA --runtime LWR_CORE ' +
          `--host-domains http://app.example.com --components c/myButton --eca-contact-email dev@example.com --eca-callback-url https://app.example.com/cb --output-dir ${dir}`,
        { ensureExitCode: 1 }
      ).shellOutput.stderr;
      expect(stderr).to.match(/host domain/i);
      expect(stderr).to.match(/https/i);
    });
  });
});

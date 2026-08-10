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
import url from 'node:url';
import { expect } from 'chai';
import { TestSession, execCmd } from '@salesforce/cli-plugins-testkit';
import { Messages } from '@salesforce/core';
import { nls } from '@salesforce/templates/lib/i18n/index.js';
import assert from 'yeoman-assert';

Messages.importMessagesDirectory(path.dirname(url.fileURLToPath(import.meta.url)));
const messages = Messages.loadMessages('@salesforce/plugin-templates', 'messages');

describe('template generate lightning interface:', () => {
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
  describe('Check lightning interface creation', () => {
    it('should create lightning interface foo using DefaultLightningIntf template and aura output directory', () => {
      execCmd(
        'template generate lightning interface --interfacename foo --outputdir aura --template DefaultLightningIntf',
        {
          ensureExitCode: 0,
        }
      );
      assert.file(path.join(session.project.dir, 'aura', 'foo', 'foo.intf'));
      assert.file(path.join(session.project.dir, 'aura', 'foo', 'foo.intf-meta.xml'));
    });
    it('should create lightning interface foo using DefaultLightningIntf template and aura output directory and no -meta.xml file', () => {
      execCmd(
        'template generate lightning interface --interfacename foometa --outputdir aura --template DefaultLightningIntf --internal',
        { ensureExitCode: 0 }
      );
      assert.file(path.join(session.project.dir, 'aura', 'foometa', 'foometa.intf'));
      assert.noFile(path.join(session.project.dir, 'aura', 'foometa', 'foometa.intf-meta.xml'));
    });
    it('should create lightning interface foo using DefaultLightningIntf template and custom output directory', () => {
      execCmd(
        `template generate lightning interface --interfacename foo --outputdir ${path.join(
          'aura',
          'interfacetest'
        )} --template DefaultLightningIntf`,
        { ensureExitCode: 0 }
      );
      assert.file(path.join(session.project.dir, 'aura', 'interfacetest', 'foo', 'foo.intf'));
      assert.file(path.join(session.project.dir, 'aura', 'interfacetest', 'foo', 'foo.intf-meta.xml'));
    });
  });
  describe('lightning interface failures', () => {
    it('should throw invalid template name error', () => {
      const stderr = execCmd(
        'template generate lightning interface --interfacename foo --outputdir aura --template foo'
      ).shellOutput.stderr;
      expect(stderr).to.contain(messages.getMessage('InvalidTemplate'));
    });

    it('should throw missing aura parent folder error', () => {
      const stderr = execCmd('template generate lightning interface --interfacename foo').shellOutput.stderr;
      expect(stderr).to.contain(messages.getMessage('MissingAuraFolder'));
    });

    it('should throw missing interfacename error', () => {
      const stderr = execCmd('template generate lightning interface --outputdir aura').shellOutput.stderr;
      expect(stderr).to.contain('Missing required flag');
    });

    it('should throw invalid non alphanumeric interfacename error', () => {
      const stderr = execCmd('template generate lightning interface --interfacename /a --outputdir aura').shellOutput
        .stderr;
      expect(stderr).to.contain(nls.localize('AlphaNumericNameError'));
    });

    it('should throw invalid interfacename starting with numeric error', () => {
      const stderr = execCmd('template generate lightning interface --interfacename 3aa --outputdir aura').shellOutput
        .stderr;
      expect(stderr).to.contain(nls.localize('NameMustStartWithLetterError'));
    });

    it('should throw invalid interfacename ending with underscore error', () => {
      const stderr = execCmd('template generate lightning interface --interfacename a_ --outputdir aura').shellOutput
        .stderr;
      expect(stderr).to.contain(nls.localize('EndWithUnderscoreError'));
    });

    it('should throw invalid interfacename with double underscore error', () => {
      const stderr = execCmd('template generate lightning interface --interfacename a__a --outputdir aura').shellOutput
        .stderr;
      expect(stderr).to.contain(nls.localize('DoubleUnderscoreError'));
    });
  });
});

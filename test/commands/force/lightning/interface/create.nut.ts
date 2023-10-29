/*
 * Copyright (c) 2019, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import * as path from 'node:path';
import { expect } from 'chai';
import { TestSession, execCmd } from '@salesforce/cli-plugins-testkit';
import { Messages } from '@salesforce/core';
import { nls } from '@salesforce/templates/lib/i18n';
import * as assert from 'yeoman-assert';

Messages.importMessagesDirectory(__dirname);
const messages = Messages.loadMessages('@salesforce/plugin-templates', 'messages');

describe('Lightning interface creation tests:', () => {
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
      execCmd('force:lightning:interface:create --interfacename foo --outputdir aura --template DefaultLightningIntf', {
        ensureExitCode: 0,
      });
      assert.file(path.join(session.project.dir, 'aura', 'foo', 'foo.intf'));
      assert.file(path.join(session.project.dir, 'aura', 'foo', 'foo.intf-meta.xml'));
    });
    it('should create lightning interface foo using DefaultLightningIntf template and aura output directory and no -meta.xml file', () => {
      execCmd(
        'force:lightning:interface:create --interfacename foometa --outputdir aura --template DefaultLightningIntf --internal',
        { ensureExitCode: 0 }
      );
      assert.file(path.join(session.project.dir, 'aura', 'foometa', 'foometa.intf'));
      assert.noFile(path.join(session.project.dir, 'aura', 'foometa', 'foometa.intf-meta.xml'));
    }),
      it('should create lightning interface foo using DefaultLightningIntf template and custom output directory', () => {
        execCmd(
          `force:lightning:interface:create --interfacename foo --outputdir ${path.join(
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
      const stderr = execCmd('force:lightning:interface:create --interfacename foo --outputdir aura --template foo')
        .shellOutput.stderr;
      expect(stderr).to.contain(messages.getMessage('InvalidTemplate'));
    });

    it('should throw missing aura parent folder error', () => {
      const stderr = execCmd('force:lightning:interface:create --interfacename foo').shellOutput.stderr;
      expect(stderr).to.contain(messages.getMessage('MissingAuraFolder'));
    });

    it('should throw missing interfacename error', () => {
      const stderr = execCmd('force:lightning:interface:create --outputdir aura').shellOutput.stderr;
      expect(stderr).to.contain('Missing required flag');
    });

    it('should throw invalid non alphanumeric interfacename error', () => {
      const stderr = execCmd('force:lightning:interface:create --interfacename /a --outputdir aura').shellOutput.stderr;
      expect(stderr).to.contain(nls.localize('AlphaNumericNameError'));
    });

    it('should throw invalid interfacename starting with numeric error', () => {
      const stderr = execCmd('force:lightning:interface:create --interfacename 3aa --outputdir aura').shellOutput
        .stderr;
      expect(stderr).to.contain(nls.localize('NameMustStartWithLetterError'));
    });

    it('should throw invalid interfacename ending with underscore error', () => {
      const stderr = execCmd('force:lightning:interface:create --interfacename a_ --outputdir aura').shellOutput.stderr;
      expect(stderr).to.contain(nls.localize('EndWithUnderscoreError'));
    });

    it('should throw invalid interfacename with double underscore error', () => {
      const stderr = execCmd('force:lightning:interface:create --interfacename a__a --outputdir aura').shellOutput
        .stderr;
      expect(stderr).to.contain(nls.localize('DoubleUnderscoreError'));
    });
  });
});

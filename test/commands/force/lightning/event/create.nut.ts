/*
 * Copyright (c) 2019, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import path from 'node:path';
import url from 'node:url';
import { expect, config } from 'chai';
import { TestSession, execCmd } from '@salesforce/cli-plugins-testkit';
import { Messages } from '@salesforce/core';
import { nls } from '@salesforce/templates/lib/i18n';
import assert from 'yeoman-assert';

config.truncateThreshold = 0;

Messages.importMessagesDirectory(path.dirname(url.fileURLToPath(import.meta.url)));
const messages = Messages.loadMessages('@salesforce/plugin-templates', 'messages');

describe('Lightning event creation tests:', () => {
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

  describe('Check lightning event creation', () => {
    it('should create lightning event foo using DefaultLightningEvt template and aura output directory', () => {
      execCmd('force:lightning:event:create --eventname foo --outputdir aura --template DefaultLightningEvt', {
        ensureExitCode: 0,
      });
      assert.file(path.join(session.project.dir, 'aura', 'foo', 'foo.evt'));
      assert.file(path.join(session.project.dir, 'aura', 'foo', 'foo.evt-meta.xml'));
    });

    it('should create lightning event foo using DefaultLightningEvt template and aura output directory with no -meta.xml file', () => {
      execCmd(
        'force:lightning:event:create --eventname foometa --outputdir aura --template DefaultLightningEvt --internal',
        { ensureExitCode: 0 }
      );
      assert.file(path.join(session.project.dir, 'aura', 'foometa', 'foometa.evt'));
      assert.noFile(path.join(session.project.dir, 'aura', 'foometa', 'foometa.evt-meta.xml'));
    });

    it('should create lightning event foo in a new directory', () => {
      execCmd(`force:lightning:event:create --eventname foo --outputdir ${path.join('aura', 'testing')}`, {
        ensureExitCode: 0,
      });
      assert.file(path.join(session.project.dir, 'aura', 'testing', 'foo', 'foo.evt'));
    });
  }),
    describe('lightning event failures', () => {
      it('should throw invalid template name error', () => {
        const stderr = execCmd('force:lightning:event:create --eventname foo --outputdir aura --template foo')
          .shellOutput.stderr;
        expect(stderr).to.contain(messages.getMessage('InvalidTemplate'));
      });

      it('should throw missing aura parent folder error', () => {
        const stderr = execCmd('force:lightning:event:create --eventname foo').shellOutput.stderr;
        expect(stderr).to.contain(messages.getMessage('MissingAuraFolder'));
      });

      it('should throw missing eventname error', () => {
        const stderr = execCmd('force:lightning:event:create --outputdir aura').shellOutput.stderr;
        expect(stderr).to.contain('Missing required flag');
      });

      it('should throw invalid non alphanumeric eventname error', () => {
        const stderr = execCmd('force:lightning:event:create --eventname /a --outputdir aura').shellOutput.stderr;
        expect(stderr).to.contain(nls.localize('AlphaNumericNameError'));
      });

      it('should throw invalid eventname starting with numeric error', () => {
        const stderr = execCmd('force:lightning:event:create --eventname 3aa --outputdir aura').shellOutput.stderr;
        expect(stderr).to.contain(nls.localize('NameMustStartWithLetterError'));
      });

      it('should throw invalid eventname ending with underscore error', () => {
        const stderr = execCmd('force:lightning:event:create --eventname a_ --outputdir aura').shellOutput.stderr;
        expect(stderr).to.contain(nls.localize('EndWithUnderscoreError'));
      });

      it('should throw invalid eventname with double underscore error', () => {
        const stderr = execCmd('force:lightning:event:create --eventname a__a --outputdir aura').shellOutput.stderr;
        expect(stderr).to.contain(nls.localize('DoubleUnderscoreError'));
      });
    });
});

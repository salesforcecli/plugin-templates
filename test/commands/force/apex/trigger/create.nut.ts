/*
 * Copyright (c) 2019, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import path from 'node:path';
import { expect } from 'chai';
import { TestSession, execCmd } from '@salesforce/cli-plugins-testkit';
import { nls } from '@salesforce/templates/lib/i18n/index.js';
import assert from 'yeoman-assert';

describe('Apex trigger creation tests:', () => {
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

  describe('Check apex trigger creation', () => {
    it('should create foo trigger using ApexTrigger template and default output directory', () => {
      execCmd('force:apex:trigger:create --triggername foo', { ensureExitCode: 0 });
      assert.file(['foo.trigger', 'foo.trigger-meta.xml'].map((f) => path.join(session.project.dir, f)));
      assert.fileContent(path.join(session.project.dir, 'foo.trigger'), 'trigger foo on SOBJECT (before insert)');
    });

    it('should create foo trigger with a targetpath and sobject set', () => {
      execCmd('force:apex:trigger:create --triggername foo --sobject customsobject --outputdir apextriggertestfolder', {
        ensureExitCode: 0,
      });
      assert.file(
        [
          path.join('apextriggertestfolder', 'foo.trigger'),
          path.join('apextriggertestfolder', 'foo.trigger-meta.xml'),
        ].map((f) => path.join(session.project.dir, f))
      );
      assert.fileContent(
        path.join(session.project.dir, 'apextriggertestfolder', 'foo.trigger'),
        'trigger foo on customsobject (before insert)'
      );
    });

    it('should override foo trigger with a different sobject and triggerevent', () => {
      execCmd('force:apex:trigger:create --triggername foo --sobject override --triggerevents "after insert"', {
        ensureExitCode: 0,
      });
      assert.file(['foo.trigger', 'foo.trigger-meta.xml'].map((f) => path.join(session.project.dir, f)));
      assert.fileContent(path.join(session.project.dir, 'foo.trigger'), 'trigger foo on override (after insert)');
    });

    it('should create foo trigger in custom folder name that has a space in it', () => {
      execCmd('force:apex:trigger:create --triggername foo --outputdir "classes create"', { ensureExitCode: 0 });
      assert.file(
        [path.join('classes create', 'foo.trigger'), path.join('classes create', 'foo.trigger-meta.xml')].map((f) =>
          path.join(session.project.dir, f)
        )
      );
      assert.fileContent(
        path.join(session.project.dir, 'classes create', 'foo.trigger'),
        'trigger foo on SOBJECT (before insert)'
      );
    });
  });
  describe('Check that all invalid name errors are thrown', () => {
    it('should throw a missing trigger name error', () => {
      const stderr = execCmd('force:apex:trigger:create').shellOutput.stderr;
      expect(stderr).to.contain('Missing required flag');
    });

    it('should throw invalid non alphanumeric trigger name error', () => {
      const stderr = execCmd('force:apex:trigger:create --triggername /a').shellOutput.stderr;
      expect(stderr).to.contain(nls.localize('AlphaNumericNameError'));
    });

    it('should throw invalid trigger name starting with numeric error', () => {
      const stderr = execCmd('force:apex:trigger:create --triggername 3aa').shellOutput.stderr;
      expect(stderr).to.contain(nls.localize('NameMustStartWithLetterError'));
    });

    it('should throw invalid trigger name ending with underscore error', () => {
      const stderr = execCmd('force:apex:trigger:create --triggername a_').shellOutput.stderr;
      expect(stderr).to.contain(nls.localize('EndWithUnderscoreError'));
    });

    it('should throw invalid trigger name with double underscore error', () => {
      const stderr = execCmd('force:apex:trigger:create --triggername a__a').shellOutput.stderr;
      expect(stderr).to.contain(nls.localize('DoubleUnderscoreError'));
    });
  });
});

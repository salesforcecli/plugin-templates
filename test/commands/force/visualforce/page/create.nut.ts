/*
 * Copyright (c) 2019, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import path from 'node:path';
import { expect, config } from 'chai';
import { TestSession, execCmd } from '@salesforce/cli-plugins-testkit';
import { nls } from '@salesforce/templates/lib/i18n';
import assert from 'yeoman-assert';

config.truncateThreshold = 0;

describe('Visualforce page creation tests:', () => {
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
  describe('Check visualforce page creation', () => {
    it('should create foo page using DefaultVFPage template and default output directory', () => {
      execCmd('force:visualforce:page:create --pagename foo --label testlabel', { ensureExitCode: 0 });
      assert.file(['foo.page', 'foo.page-meta.xml'].map((f) => path.join(session.project.dir, f)));
      assert.fileContent(path.join(session.project.dir, 'foo.page'), 'This is your new Page');
      assert.fileContent(path.join(session.project.dir, 'foo.page-meta.xml'), '<label>testlabel</label>');
    });

    it('should create foo page in a folder with a custom name', () => {
      execCmd('force:visualforce:page:create --pagename foo --outputdir testpage --label testlabel', {
        ensureExitCode: 0,
      });
      assert.file(
        [path.join('testpage', 'foo.page'), path.join('testpage', 'foo.page-meta.xml')].map((f) =>
          path.join(session.project.dir, f)
        )
      );
    });

    it('should create foo page in custom folder name that has a space in it', () => {
      execCmd('force:visualforce:page:create --pagename foo --outputdir "folder space" --label label', {
        ensureExitCode: 0,
      });
      assert.file(
        [path.join('folder space', 'foo.page'), path.join('folder space', 'foo.page-meta.xml')].map((f) =>
          path.join(session.project.dir, f)
        )
      );
    });
  });

  describe('Check that all invalid name errors are thrown', () => {
    it('should throw a missing pagename error', () => {
      const stderr = execCmd('force:visualforce:page:create').shellOutput.stderr;
      expect(stderr).to.contain('Missing required flag');
    });

    it('should throw invalid non alphanumeric pagename error', () => {
      const stderr = execCmd('force:visualforce:page:create --pagename /a --label foo').shellOutput.stderr;
      expect(stderr).to.contain(nls.localize('AlphaNumericNameError'));
    });

    it('should throw invalid pagename starting with numeric error', () => {
      const stderr = execCmd('force:visualforce:page:create --pagename 3aa --label foo').shellOutput.stderr;
      expect(stderr).to.contain(nls.localize('NameMustStartWithLetterError'));
    });

    it('should throw invalid pagename ending with underscore error', () => {
      const stderr = execCmd('force:visualforce:page:create --pagename a_ --label foo').shellOutput.stderr;
      expect(stderr).to.contain(nls.localize('EndWithUnderscoreError'));
    });

    it('should throw invalid pagename with double underscore error', () => {
      const stderr = execCmd('force:visualforce:page:create --pagename a__a --label foo').shellOutput.stderr;
      expect(stderr).to.contain(nls.localize('DoubleUnderscoreError'));
    });
  });
});

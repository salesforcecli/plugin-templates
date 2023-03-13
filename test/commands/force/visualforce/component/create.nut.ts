/*
 * Copyright (c) 2019, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import * as path from 'path';
import { expect, config } from 'chai';
import { TestSession, execCmd } from '@salesforce/cli-plugins-testkit';
import { nls } from '@salesforce/templates/lib/i18n';
import * as assert from 'yeoman-assert';

config.truncateThreshold = 0;

describe('Visualforce component creation tests:', () => {
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

  describe('Check visualforce component creation', () => {
    it('should create foo component using DefaultVFComponent template and default output directory', () => {
      execCmd('force:visualforce:component:create --componentname foo --label testlabel', { ensureExitCode: 0 });
      assert.file(['foo.component', 'foo.component-meta.xml'].map((f) => path.join(session.project.dir, f)));
      assert.fileContent(path.join(session.project.dir, 'foo.component'), 'This is your new Component');
      assert.fileContent(path.join(session.project.dir, 'foo.component-meta.xml'), '<label>testlabel</label>');
    });

    it('should create foo component in a folder with a custom name', () => {
      execCmd('force:visualforce:component:create --componentname foo --outputdir testcomponent --label testlabel', {
        ensureExitCode: 0,
      });
      assert.file(
        [path.join('testcomponent', 'foo.component'), path.join('testcomponent', 'foo.component-meta.xml')].map((f) =>
          path.join(session.project.dir, f)
        )
      );
    });

    it('should create foo component in custom folder name that has a space in it', () => {
      execCmd("force:visualforce:component:create --componentname foo --outputdir 'classes create' --label label", {
        ensureExitCode: 0,
      });
      assert.file(
        [path.join('classes create', 'foo.component'), path.join('classes create', 'foo.component-meta.xml')].map((f) =>
          path.join(session.project.dir, f)
        )
      );
    });
  });

  describe('Check that all invalid name errors are thrown', () => {
    it('should throw a missing componentname error', () => {
      const stderr = execCmd('force:visualforce:component:create').shellOutput.stderr;
      expect(stderr).to.contain('Missing required flag');
    });

    it('should throw invalid non alphanumeric componentname error', () => {
      const stderr = execCmd('force:visualforce:component:create --componentname /a --label foo').shellOutput.stderr;
      expect(stderr).to.contain(nls.localize('AlphaNumericNameError'));
    });

    it('should throw invalid componentname starting with numeric error', () => {
      const stderr = execCmd('force:visualforce:component:create --componentname 3aa --label foo').shellOutput.stderr;
      expect(stderr).to.contain(nls.localize('NameMustStartWithLetterError'));
    });

    it('should throw invalid componentname ending with underscore error', () => {
      const stderr = execCmd('force:visualforce:component:create --componentname a_ --label foo').shellOutput.stderr;
      expect(stderr).to.contain(nls.localize('EndWithUnderscoreError'));
    });

    it('should throw invalid componentname with double underscore error', () => {
      const stderr = execCmd('force:visualforce:component:create --componentname a__a --label foo').shellOutput.stderr;
      expect(stderr).to.contain(nls.localize('DoubleUnderscoreError'));
    });
  });
});

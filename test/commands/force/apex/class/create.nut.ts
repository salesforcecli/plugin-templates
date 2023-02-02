/*
 * Copyright (c) 2019, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import * as path from 'path';
import { expect } from 'chai';
import { TestSession, execCmd } from '@salesforce/cli-plugins-testkit';
import { nls } from '@salesforce/templates/lib/i18n';
import * as assert from 'yeoman-assert';

describe('Apex class creation tests:', () => {
  let session: TestSession;
  before(async () => {
    session = await TestSession.create({
      project: {},
      devhubAuthStrategy: 'NONE',
    });
  });
  after(async () => {
    // await session?.clean();
  });

  describe('Check apex class creation', () => {
    it('should create foo class using DefaultApexClass template and default output directory', () => {
      execCmd('force:apex:class:create --classname foo', { ensureExitCode: 0 });
      assert.file(['foo.cls', 'foo.cls-meta.xml'].map((f) => path.join(session.project.dir, f)));
      assert.fileContent(path.join(session.project.dir, 'foo.cls'), 'public with sharing class foo');
    });

    it('should create foo class with a targetpath set and ApexException template', () => {
      execCmd('force:apex:class:create --classname foo --outputdir testfolder --template ApexException', {
        ensureExitCode: 0,
      });
      assert.file([
        path.join(session.project.dir, 'testfolder', 'foo.cls'),
        path.join(session.project.dir, 'testfolder', 'foo.cls-meta.xml'),
      ]);
      assert.fileContent(path.join(session.project.dir, 'testfolder', 'foo.cls'), 'public class foo extends Exception');
    });

    it('should override foo class using ApexException template', () => {
      execCmd('force:apex:class:create --classname foo --template ApexException', { ensureExitCode: 0 });
      assert.file(['foo.cls', 'foo.cls-meta.xml'].map((f) => path.join(session.project.dir, f)));
      assert.fileContent(path.join(session.project.dir, 'foo.cls'), 'public class foo extends Exception');
    });

    it('should create foo class in custom folder name that has a space in it', () => {
      execCmd('force:apex:class:create --classname foo --outputdir "classes create"', { ensureExitCode: 0 });
      assert.file([
        path.join(session.project.dir, 'classes create', 'foo.cls'),
        path.join(session.project.dir, 'classes create', 'foo.cls-meta.xml'),
      ]);
      assert.fileContent(path.join(session.project.dir, 'classes create', 'foo.cls'), 'public with sharing class foo');
    });
  });

  describe('Check that all invalid name errors are thrown', () => {
    it('should throw a missing classname error', () => {
      const stderr = execCmd('force:apex:class:create').shellOutput.stderr;
      expect(stderr).to.contain('Missing required flag');
    });

    it('should throw invalid non alphanumeric class name error', () => {
      const stderr = execCmd('force:apex:class:create --classname /a').shellOutput.stderr;
      expect(stderr).to.contain(nls.localize('AlphaNumericNameError'));
    });

    it('should throw invalid class name starting with numeric error', () => {
      const stderr = execCmd('force:apex:class:create --classname 3aa').shellOutput.stderr;
      expect(stderr).to.contain(nls.localize('NameMustStartWithLetterError'));
    });

    it('should throw invalid class name ending with underscore error', () => {
      const stderr = execCmd('force:apex:class:create --classname a_').shellOutput.stderr;
      expect(stderr).to.contain(nls.localize('EndWithUnderscoreError'));
    });

    it('should throw invalid class name with double underscore error', () => {
      const stderr = execCmd('force:apex:class:create --classname a__a').shellOutput.stderr;
      expect(stderr).to.contain(nls.localize('DoubleUnderscoreError'));
    });
  });
});

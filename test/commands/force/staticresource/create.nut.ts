/*
 * Copyright (c) 2020, salesforce.com, inc.
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
describe('Static resource creation tests:', () => {
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
  describe('Check static resource creation', () => {
    it('should create foo css static resource in the default output directory', () => {
      execCmd('force:staticresource:create --resourcename foo --contenttype text/css', { ensureExitCode: 0 });
      assert.file(['foo.css', 'foo.resource-meta.xml'].map((f) => path.join(session.project.dir, f)));
      assert.fileContent(
        path.join(session.project.dir, 'foo.css'),
        '/* Replace the contents of this file with your static resource */'
      );
    });

    it('should create foo javascript static resource in the default output directory', () => {
      execCmd('force:staticresource:create --resourcename foo --contenttype application/javascript', {
        ensureExitCode: 0,
      });
      assert.file(['foo.js', 'foo.resource-meta.xml'].map((f) => path.join(session.project.dir, f)));
      assert.fileContent(
        path.join(session.project.dir, 'foo.js'),
        '// Replace the contents of this file with your static resource'
      );
    });

    it('should create foo json static resource in the default output directory', () => {
      execCmd('force:staticresource:create --resourcename foo --contenttype application/json', { ensureExitCode: 0 });
      assert.file(['foo.json', 'foo.resource-meta.xml'].map((f) => path.join(session.project.dir, f)));
      assert.fileContent(
        path.join(session.project.dir, 'foo.json'),
        '{\n  "__info": "Replace the contents of this file with your static resource"\n}\n'
      );
    });

    it('should create foo json static resource in the default output directory', () => {
      execCmd('force:staticresource:create --resourcename foo --contenttype text/plain', { ensureExitCode: 0 });
      assert.file(['foo.txt', 'foo.resource-meta.xml'].map((f) => path.join(session.project.dir, f)));
      assert.fileContent(
        path.join(session.project.dir, 'foo.txt'),
        'Replace the contents of this file with your static resource'
      );
    });

    it('should create foo generic static resource in the default output directory', () => {
      execCmd('force:staticresource:create --resourcename fooPDF --contenttype application/pdf', { ensureExitCode: 0 });
      assert.file(['fooPDF.resource', 'fooPDF.resource-meta.xml'].map((f) => path.join(session.project.dir, f)));
      assert.fileContent(
        path.join(session.project.dir, 'fooPDF.resource'),
        'Replace this file with your static resource (i.e. an image)'
      );
    });

    it('should create foo static resource in the default output directory', () => {
      execCmd('force:staticresource:create --resourcename foo', { ensureExitCode: 0 });
      assert.file(['foo/.gitkeep', 'foo.resource-meta.xml'].map((f) => path.join(session.project.dir, f)));
      assert.fileContent(path.join(session.project.dir, 'foo/.gitkeep'), 'This file can be deleted');
    });

    it('should create foo resource with a targetpath set', () => {
      execCmd(
        'force:staticresource:create --resourcename srjs --outputdir resourcesjs --contenttype application/javascript',
        { ensureExitCode: 0 }
      );
      assert.file(
        [path.join('resourcesjs', 'srjs.resource-meta.xml'), path.join('resourcesjs', 'srjs.js')].map((f) =>
          path.join(session.project.dir, f)
        )
      );
    });

    it('should create foo static resource in custom folder name that has a space in it', () => {
      execCmd('force:staticresource:create --resourcename foo --outputdir "staticresource create"', {
        ensureExitCode: 0,
      });
      assert.file(
        [
          path.join('staticresource create', 'foo', '.gitkeep'),
          path.join('staticresource create', 'foo.resource-meta.xml'),
        ].map((f) => path.join(session.project.dir, f))
      );
      assert.fileContent(
        path.join(session.project.dir, 'staticresource create', 'foo', '.gitkeep'),
        'This file can be deleted'
      );
    });
  });

  describe('Check that all invalid name errors are thrown', () => {
    it('should throw a missing resourcename error', () => {
      const stderr = execCmd('force:staticresource:create').shellOutput.stderr;
      expect(stderr).to.contain('Missing required flag');
    });

    it('should throw invalid non alphanumeric static resource name error', () => {
      const stderr = execCmd('force:staticresource:create --resourcename /a').shellOutput.stderr;
      expect(stderr).to.contain(nls.localize('AlphaNumericNameError'));
    });

    it('should throw invalid static resource name starting with numeric error', () => {
      const stderr = execCmd('force:staticresource:create --resourcename 3aa').shellOutput.stderr;
      expect(stderr).to.contain(nls.localize('NameMustStartWithLetterError'));
    });

    it('should throw invalid static resource name ending with underscore error', () => {
      const stderr = execCmd('force:staticresource:create --resourcename a_').shellOutput.stderr;
      expect(stderr).to.contain(nls.localize('EndWithUnderscoreError'));
    });

    it('should throw invalid static resource name with double underscore error', () => {
      const stderr = execCmd('force:staticresource:create --resourcename a__a').shellOutput.stderr;
      expect(stderr).to.contain(nls.localize('DoubleUnderscoreError'));
    });

    it('should throw an invalid mime type error', () => {
      const stderr = execCmd('force:staticresource:create --resourcename foo --contenttype notvalid').shellOutput
        .stderr;
      expect(stderr).to.contain(nls.localize('InvalidMimeType'));
    });
  });
});

/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import path from 'node:path';
import { expect } from 'chai';
import { TestSession, execCmd } from '@salesforce/cli-plugins-testkit';
import { nls } from '@salesforce/templates/lib/i18n/index.js';
import assert from 'yeoman-assert';

describe('template generate web application:', () => {
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

  describe('Check webapp creation with default template', () => {
    it('should create webapp using default template in webapplications directory', () => {
      const outputDir = path.join(session.project.dir, 'force-app', 'main', 'default', 'webapplications');
      execCmd(`template generate webapp --name MyWebApp --output-dir "${outputDir}"`, { ensureExitCode: 0 });
      assert.file([
        path.join(outputDir, 'MyWebApp', 'MyWebApp.webapplication-meta.xml'),
        path.join(outputDir, 'MyWebApp', 'src', 'index.html'),
        path.join(outputDir, 'MyWebApp', 'webapplication.json'),
      ]);
      assert.fileContent(
        path.join(outputDir, 'MyWebApp', 'MyWebApp.webapplication-meta.xml'),
        '<masterLabel>My Web App</masterLabel>'
      );
    });

    it('should default to project webapplications directory when --output-dir is omitted', () => {
      const expectedOutputDir = path.join(session.project.dir, 'force-app', 'main', 'default', 'webapplications');
      execCmd('template generate webapp --name DefaultDirApp', { ensureExitCode: 0 });
      assert.file([
        path.join(expectedOutputDir, 'DefaultDirApp', 'DefaultDirApp.webapplication-meta.xml'),
        path.join(expectedOutputDir, 'DefaultDirApp', 'src', 'index.html'),
        path.join(expectedOutputDir, 'DefaultDirApp', 'webapplication.json'),
      ]);
    });

    it('should create webapp with custom label', () => {
      const outputDir = path.join(session.project.dir, 'force-app', 'main', 'default', 'webapplications');
      execCmd(`template generate webapp --name TestApp --label "Custom Label" --output-dir "${outputDir}"`, {
        ensureExitCode: 0,
      });
      assert.file([
        path.join(outputDir, 'TestApp', 'TestApp.webapplication-meta.xml'),
        path.join(outputDir, 'TestApp', 'src', 'index.html'),
      ]);
      assert.fileContent(path.join(outputDir, 'TestApp', 'src', 'index.html'), '<title>Welcome to Web App</title>');
    });
  });

  describe('Check webapp creation with reactbasic template', () => {
    it('should create React webapp with all required files', () => {
      const outputDir = path.join(session.project.dir, 'force-app', 'main', 'default', 'webapplications');
      execCmd(`template generate webapp --name MyReactApp --template reactbasic --output-dir "${outputDir}"`, {
        ensureExitCode: 0,
      });
      assert.file([
        path.join(outputDir, 'MyReactApp', 'MyReactApp.webapplication-meta.xml'),
        path.join(outputDir, 'MyReactApp', 'index.html'),
        path.join(outputDir, 'MyReactApp', 'webapplication.json'),
        path.join(outputDir, 'MyReactApp', 'package.json'),
      ]);
      assert.fileContent(path.join(outputDir, 'MyReactApp', 'package.json'), '"name": "base-react-app"');
    });
  });

  describe('Check that all invalid name errors are thrown', () => {
    it('should throw a missing name error', () => {
      const stderr = execCmd('template generate webapp').shellOutput.stderr;
      expect(stderr).to.contain('Missing required flag');
    });

    it('should throw invalid non alphanumeric webapp name error', () => {
      const outputDir = path.join(session.project.dir, 'force-app', 'main', 'default', 'webapplications');
      const stderr = execCmd(`template generate webapp --name /a --output-dir "${outputDir}"`).shellOutput.stderr;
      expect(stderr).to.contain(nls.localize('AlphaNumericNameError'));
    });

    it('should throw invalid webapp name starting with numeric error', () => {
      const outputDir = path.join(session.project.dir, 'force-app', 'main', 'default', 'webapplications');
      const stderr = execCmd(`template generate webapp --name 3aa --output-dir "${outputDir}"`).shellOutput.stderr;
      expect(stderr).to.contain(nls.localize('NameMustStartWithLetterError'));
    });

    it('should throw invalid webapp name ending with underscore error', () => {
      const outputDir = path.join(session.project.dir, 'force-app', 'main', 'default', 'webapplications');
      const stderr = execCmd(`template generate webapp --name a_ --output-dir "${outputDir}"`).shellOutput.stderr;
      expect(stderr).to.contain(nls.localize('EndWithUnderscoreError'));
    });

    it('should throw invalid webapp name with double underscore error', () => {
      const outputDir = path.join(session.project.dir, 'force-app', 'main', 'default', 'webapplications');
      const stderr = execCmd(`template generate webapp --name a__a --output-dir "${outputDir}"`).shellOutput.stderr;
      expect(stderr).to.contain(nls.localize('DoubleUnderscoreError'));
    });

    it('should throw error when output dir is not webapplications folder', () => {
      const stderr = execCmd('template generate webapp --name TestApp --output-dir /tmp/invalid').shellOutput.stderr;
      expect(stderr).to.contain(nls.localize('MissingWebApplicationsDir'));
    });
  });
});

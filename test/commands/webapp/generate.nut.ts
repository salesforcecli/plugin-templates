/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import path from 'node:path';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import { expect } from 'chai';
import { TestSession, execCmd } from '@salesforce/cli-plugins-testkit';
import { nls } from '@salesforce/templates/lib/i18n/index.js';
import assert from 'yeoman-assert';

describe('Web application creation tests:', () => {
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

  describe('Verify templates are loaded from NPM package', () => {
    it('should use templates from @salesforce/templates NPM package', () => {
      // Verify that templates are loaded from NPM package, not file-based
      const require = createRequire(import.meta.url);
      const packagePath = require.resolve('@salesforce/templates/package.json');
      const packageDir = path.dirname(packagePath);
      const templatesPath = path.join(packageDir, 'lib', 'templates', 'webapplication');

      // Verify the NPM package templates directory exists
      expect(fs.existsSync(templatesPath), 'NPM package templates directory should exist').to.be.true;

      // Verify webapplication templates exist in NPM package
      const templateFiles = fs.readdirSync(templatesPath);
      expect(templateFiles.length, 'WebApplication templates should exist in NPM package').to.be.greaterThan(0);
      expect(templateFiles, 'Should contain webappbasic template').to.include('webappbasic');
    });
  });

  describe('Check webapp creation with default template', () => {
    it('should create webapp using default template in webApplications directory', () => {
      const outputDir = path.join(session.project.dir, 'force-app', 'main', 'default', 'webApplications');
      execCmd(`webapp generate --name MyWebApp --output-dir "${outputDir}"`, { ensureExitCode: 0 });
      assert.file([
        path.join(outputDir, 'MyWebApp', 'MyWebApp.webApplication-meta.xml'),
        path.join(outputDir, 'MyWebApp', 'index.html'),
        path.join(outputDir, 'MyWebApp', 'webapp.json'),
      ]);
      assert.fileContent(path.join(outputDir, 'MyWebApp', 'index.html'), '<title>My Web App</title>');
    });

    it('should default to project webApplications directory when --output-dir is omitted', () => {
      const expectedOutputDir = path.join(session.project.dir, 'force-app', 'main', 'default', 'webApplications');
      execCmd('webapp generate --name DefaultDirApp', { ensureExitCode: 0 });
      assert.file([
        path.join(expectedOutputDir, 'DefaultDirApp', 'DefaultDirApp.webApplication-meta.xml'),
        path.join(expectedOutputDir, 'DefaultDirApp', 'index.html'),
        path.join(expectedOutputDir, 'DefaultDirApp', 'webapp.json'),
      ]);
    });

    it('should create webapp with custom label', () => {
      const outputDir = path.join(session.project.dir, 'force-app', 'main', 'default', 'webApplications');
      execCmd(`webapp generate --name TestApp --label "Custom Label" --output-dir "${outputDir}"`, {
        ensureExitCode: 0,
      });
      assert.file([
        path.join(outputDir, 'TestApp', 'TestApp.webApplication-meta.xml'),
        path.join(outputDir, 'TestApp', 'index.html'),
      ]);
      assert.fileContent(path.join(outputDir, 'TestApp', 'index.html'), '<title>Custom Label</title>');
    });
  });

  describe('Check webapp creation with reactbasic template', () => {
    it('should create React webapp with all required files', () => {
      const outputDir = path.join(session.project.dir, 'force-app', 'main', 'default', 'webApplications');
      execCmd(`webapp generate --name MyReactApp --template reactbasic --output-dir "${outputDir}"`, {
        ensureExitCode: 0,
      });
      assert.file([
        path.join(outputDir, 'MyReactApp', 'MyReactApp.webApplication-meta.xml'),
        path.join(outputDir, 'MyReactApp', 'index.html'),
        path.join(outputDir, 'MyReactApp', 'webapp.json'),
        path.join(outputDir, 'MyReactApp', 'package.json'),
        path.join(outputDir, 'MyReactApp', 'vite.config.ts'),
        path.join(outputDir, 'MyReactApp', 'tsconfig.json'),
        path.join(outputDir, 'MyReactApp', 'tsconfig.node.json'),
        path.join(outputDir, 'MyReactApp', 'tailwind.config.js'),
        path.join(outputDir, 'MyReactApp', 'postcss.config.js'),
        path.join(outputDir, 'MyReactApp', 'src', 'main.tsx'),
        path.join(outputDir, 'MyReactApp', 'src', 'App.tsx'),
        path.join(outputDir, 'MyReactApp', 'src', 'routes.ts'),
        path.join(outputDir, 'MyReactApp', 'src', 'vite-env.d.ts'),
        path.join(outputDir, 'MyReactApp', 'src', 'components', 'Navigation.tsx'),
        path.join(outputDir, 'MyReactApp', 'src', 'pages', 'Home.tsx'),
        path.join(outputDir, 'MyReactApp', 'src', 'pages', 'About.tsx'),
        path.join(outputDir, 'MyReactApp', 'src', 'pages', 'NotFound.tsx'),
        path.join(outputDir, 'MyReactApp', 'src', 'styles', 'global.css'),
        path.join(outputDir, 'MyReactApp', 'src', 'test-setup', 'setup.ts'),
      ]);
      assert.fileContent(path.join(outputDir, 'MyReactApp', 'package.json'), '"name": "MyReactApp"');
    });
  });

  describe('Check that all invalid name errors are thrown', () => {
    it('should throw a missing name error', () => {
      const stderr = execCmd('webapp generate').shellOutput.stderr;
      expect(stderr).to.contain('Missing required flag');
    });

    it('should throw invalid non alphanumeric webapp name error', () => {
      const outputDir = path.join(session.project.dir, 'force-app', 'main', 'default', 'webApplications');
      const stderr = execCmd(`webapp generate --name /a --output-dir "${outputDir}"`).shellOutput.stderr;
      expect(stderr).to.contain(nls.localize('AlphaNumericNameError'));
    });

    it('should throw invalid webapp name starting with numeric error', () => {
      const outputDir = path.join(session.project.dir, 'force-app', 'main', 'default', 'webApplications');
      const stderr = execCmd(`webapp generate --name 3aa --output-dir "${outputDir}"`).shellOutput.stderr;
      expect(stderr).to.contain(nls.localize('NameMustStartWithLetterError'));
    });

    it('should throw invalid webapp name ending with underscore error', () => {
      const outputDir = path.join(session.project.dir, 'force-app', 'main', 'default', 'webApplications');
      const stderr = execCmd(`webapp generate --name a_ --output-dir "${outputDir}"`).shellOutput.stderr;
      expect(stderr).to.contain(nls.localize('EndWithUnderscoreError'));
    });

    it('should throw invalid webapp name with double underscore error', () => {
      const outputDir = path.join(session.project.dir, 'force-app', 'main', 'default', 'webApplications');
      const stderr = execCmd(`webapp generate --name a__a --output-dir "${outputDir}"`).shellOutput.stderr;
      expect(stderr).to.contain(nls.localize('DoubleUnderscoreError'));
    });

    it('should throw error when output dir is not webApplications folder', () => {
      const stderr = execCmd('webapp generate --name TestApp --output-dir /tmp/invalid').shellOutput.stderr;
      expect(stderr).to.contain(nls.localize('MissingWebApplicationsDir'));
    });
  });
});

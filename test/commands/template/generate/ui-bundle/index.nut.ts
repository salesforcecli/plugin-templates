/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import path from 'node:path';
import fs from 'node:fs';
import { expect } from 'chai';
import { TestSession, execCmd } from '@salesforce/cli-plugins-testkit';
import { nls } from '@salesforce/templates/lib/i18n/index.js';
import assert from 'yeoman-assert';
const UI_BUNDLES_DIR = 'uiBundles';

describe('template generate ui-bundle:', () => {
  let session: TestSession;
  let projectDir: string;
  before(async () => {
    session = await TestSession.create({
      project: {},
      devhubAuthStrategy: 'NONE',
    });
    projectDir = session.project.dir;
  });
  after(async () => {
    await session?.clean();
  });

  describe('Check UI bundle creation with default template', () => {
    it('should create UI bundle using default template in uiBundles directory', () => {
      const outputDir = path.join(projectDir, 'force-app', 'main', 'default', UI_BUNDLES_DIR);
      execCmd(`template generate ui-bundle --name MyUiBundle --output-dir "${outputDir}"`, { ensureExitCode: 0 });
      assert.file([
        path.join(outputDir, 'MyUiBundle', 'MyUiBundle.uibundle-meta.xml'),
        path.join(outputDir, 'MyUiBundle', 'src', 'index.html'),
        path.join(outputDir, 'MyUiBundle', 'ui-bundle.json'),
      ]);
      assert.fileContent(
        path.join(outputDir, 'MyUiBundle', 'MyUiBundle.uibundle-meta.xml'),
        '<masterLabel>My Ui Bundle</masterLabel>'
      );
      assert.noFile(path.join(projectDir, '.graphqlrc.yml'));
    });

    it('should default to project uiBundles directory when --output-dir is omitted', () => {
      const expectedOutputDir = path.join(projectDir, 'force-app', 'main', 'default', UI_BUNDLES_DIR);
      execCmd('template generate ui-bundle --name DefaultDirApp', { ensureExitCode: 0 });
      assert.file([
        path.join(expectedOutputDir, 'DefaultDirApp', 'DefaultDirApp.uibundle-meta.xml'),
        path.join(expectedOutputDir, 'DefaultDirApp', 'src', 'index.html'),
        path.join(expectedOutputDir, 'DefaultDirApp', 'ui-bundle.json'),
      ]);
    });

    it('should create UI bundle with custom label', () => {
      const outputDir = path.join(projectDir, 'force-app', 'main', 'default', UI_BUNDLES_DIR);
      execCmd(`template generate ui-bundle --name TestApp --label "Custom Label" --output-dir "${outputDir}"`, {
        ensureExitCode: 0,
      });
      assert.file([
        path.join(outputDir, 'TestApp', 'TestApp.uibundle-meta.xml'),
        path.join(outputDir, 'TestApp', 'src', 'index.html'),
      ]);
      assert.fileContent(path.join(outputDir, 'TestApp', 'src', 'index.html'), '<title>Welcome to Web App</title>');
    });
  });

  describe('Check UI bundle creation with reactbasic template', () => {
    afterEach(() => {
      const rootGraphqlrc = path.join(projectDir, '.graphqlrc.yml');
      if (fs.existsSync(rootGraphqlrc)) {
        fs.unlinkSync(rootGraphqlrc);
      }
    });

    it('should create React UI bundle with all required files and create .graphqlrc.yml at the project root', () => {
      const outputDir = path.join(projectDir, 'force-app', 'main', 'default', UI_BUNDLES_DIR);
      execCmd(`template generate ui-bundle --name MyReactApp --template reactbasic --output-dir "${outputDir}"`, {
        ensureExitCode: 0,
      });
      assert.file([
        path.join(outputDir, 'MyReactApp', 'MyReactApp.uibundle-meta.xml'),
        path.join(outputDir, 'MyReactApp', 'index.html'),
        path.join(outputDir, 'MyReactApp', 'ui-bundle.json'),
        path.join(outputDir, 'MyReactApp', 'package.json'),
      ]);
      assert.fileContent(path.join(outputDir, 'MyReactApp', 'package.json'), '"name": "base-react-app"');

      const rootGraphqlrc = path.join(projectDir, '.graphqlrc.yml');
      assert.file(rootGraphqlrc);
      assert.fileContent(rootGraphqlrc, "schema: 'schema.graphql'");
      assert.fileContent(rootGraphqlrc, "documents: './**/src/**/*.{graphql,js,ts,jsx,tsx}'");

      const contentBefore = fs.readFileSync(rootGraphqlrc, 'utf8');
      const mtimeBefore = fs.statSync(rootGraphqlrc).mtimeMs;

      execCmd(`template generate ui-bundle --name MyReactApp2 --template reactbasic --output-dir "${outputDir}"`, {
        ensureExitCode: 0,
      });
      assert.file([
        path.join(outputDir, 'MyReactApp2', 'MyReactApp2.uibundle-meta.xml'),
        path.join(outputDir, 'MyReactApp2', 'package.json'),
      ]);

      const contentAfter = fs.readFileSync(rootGraphqlrc, 'utf8');
      const mtimeAfter = fs.statSync(rootGraphqlrc).mtimeMs;
      expect(contentAfter).to.equal(contentBefore);
      expect(mtimeAfter).to.equal(mtimeBefore);
    });

    it('should write the same project-root .graphqlrc.yml regardless of bundle output-dir', () => {
      const outputDir = path.join(projectDir, 'force-app', 'main', 'default', 'custom-dir');
      execCmd(
        `template generate ui-bundle --name CustomDirReactApp --template reactbasic --output-dir "${outputDir}"`,
        {
          ensureExitCode: 0,
        }
      );
      assert.file(path.join(projectDir, '.graphqlrc.yml'));
      assert.fileContent(path.join(projectDir, '.graphqlrc.yml'), "schema: 'schema.graphql'");
      assert.fileContent(path.join(projectDir, '.graphqlrc.yml'), "documents: './**/src/**/*.{graphql,js,ts,jsx,tsx}'");
    });

    it('should not overwrite an existing .graphqlrc.yml at the project root', () => {
      const outputDir = path.join(projectDir, 'force-app', 'main', 'default', UI_BUNDLES_DIR);
      const rootGraphqlrc = path.join(projectDir, '.graphqlrc.yml');
      const preexisting = "schema: 'preexisting.graphql'\ndocuments: 'preexisting/**/*.ts'\n";
      fs.writeFileSync(rootGraphqlrc, preexisting);

      execCmd(`template generate ui-bundle --name SecondReactApp --template reactbasic --output-dir "${outputDir}"`, {
        ensureExitCode: 0,
      });

      assert.fileContent(rootGraphqlrc, "schema: 'preexisting.graphql'");
    });
  });

  describe('Check that all invalid name errors are thrown', () => {
    it('should throw a missing name error', () => {
      const stderr = execCmd('template generate ui-bundle').shellOutput.stderr;
      expect(stderr).to.contain('Missing required flag');
    });

    it('should throw invalid non alphanumeric name error', () => {
      const outputDir = path.join(projectDir, 'force-app', 'main', 'default', UI_BUNDLES_DIR);
      const stderr = execCmd(`template generate ui-bundle --name /a --output-dir "${outputDir}"`).shellOutput.stderr;
      expect(stderr).to.contain(nls.localize('AlphaNumericNameError'));
    });

    it('should throw invalid name starting with numeric error', () => {
      const outputDir = path.join(projectDir, 'force-app', 'main', 'default', UI_BUNDLES_DIR);
      const stderr = execCmd(`template generate ui-bundle --name 3aa --output-dir "${outputDir}"`).shellOutput.stderr;
      expect(stderr).to.contain(nls.localize('NameMustStartWithLetterError'));
    });

    it('should throw invalid name ending with underscore error', () => {
      const outputDir = path.join(projectDir, 'force-app', 'main', 'default', UI_BUNDLES_DIR);
      const stderr = execCmd(`template generate ui-bundle --name a_ --output-dir "${outputDir}"`).shellOutput.stderr;
      expect(stderr).to.contain(nls.localize('EndWithUnderscoreError'));
    });

    it('should throw invalid name with double underscore error', () => {
      const outputDir = path.join(projectDir, 'force-app', 'main', 'default', UI_BUNDLES_DIR);
      const stderr = execCmd(`template generate ui-bundle --name a__a --output-dir "${outputDir}"`).shellOutput.stderr;
      expect(stderr).to.contain(nls.localize('DoubleUnderscoreError'));
    });

    it('should auto-append uiBundles folder when output dir does not end with uiBundles', () => {
      const outputDir = path.join(projectDir, 'force-app', 'main', 'default', 'test-dir');
      const expectedOutputDir = path.join(outputDir, UI_BUNDLES_DIR);
      execCmd(`template generate ui-bundle --name TestApp --output-dir "${outputDir}"`, { ensureExitCode: 0 });
      assert.file([
        path.join(expectedOutputDir, 'TestApp', 'TestApp.uibundle-meta.xml'),
        path.join(expectedOutputDir, 'TestApp', 'src', 'index.html'),
        path.join(expectedOutputDir, 'TestApp', 'ui-bundle.json'),
      ]);
    });
  });
});

/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import path from 'node:path';
import { expect } from 'chai';
import fs from 'fs-extra';
import esmock from 'esmock';
import { TestContext } from '@salesforce/core/testSetup';
import { stubSfCommandUx } from '@salesforce/sf-plugins-core';
import type WebAppGenerateType from '../../../src/commands/webapp/generate.js';

describe('webapp generate', () => {
  const $$ = new TestContext();
  let testDir: string;
  let mockTemplateDir: string;
  let WebAppGenerate: typeof WebAppGenerateType;

  const createMockSimpleGit = (templateSourceDir: string) => ({
    simpleGit: () => ({
      clone: async (_repo: string, outputDir: string, _options: string[]) => {
        await fs.copy(templateSourceDir, outputDir);
        await fs.ensureDir(path.join(outputDir, '.git'));
      },
    }),
  });

  const createFailingMockSimpleGit = (errorMessage: string) => ({
    simpleGit: () => ({
      clone: async () => {
        throw new Error(errorMessage);
      },
    }),
  });

  before(async () => {
    testDir = path.join(process.cwd(), '.test-temp', `webapp-test-${Date.now()}`);
    await fs.ensureDir(testDir);

    // Create mock template with sample files
    mockTemplateDir = path.join(testDir, 'mock-template');
    await fs.ensureDir(mockTemplateDir);
    await fs.writeFile(
      path.join(mockTemplateDir, 'package.json'),
      JSON.stringify({ name: 'webapp-template', version: '1.0.0' }, null, 2)
    );
    await fs.writeFile(path.join(mockTemplateDir, 'README.md'), '# Web App Template');
    await fs.ensureDir(path.join(mockTemplateDir, 'src'));
    await fs.writeFile(path.join(mockTemplateDir, 'src', 'index.js'), 'export default {};');
  });

  beforeEach(async () => {
    stubSfCommandUx($$.SANDBOX);
    WebAppGenerate = await esmock('../../../src/commands/webapp/generate.js', {
      'simple-git': createMockSimpleGit(mockTemplateDir),
    });
  });

  afterEach(() => {
    $$.restore();
  });

  after(async () => {
    if (testDir) {
      await fs.remove(testDir);
    }
  });

  describe('successful generation', () => {
    it('should use webapp-basic template when no template specified', async () => {
      const outputDir = path.join(testDir, 'output-default-template');
      const result = await WebAppGenerate.run(['--name', 'myApp', '--label', 'My App', '--output-dir', outputDir]);

      expect(result.template).to.equal('webapp-basic');
    });

    it('should create all template files in output directory', async () => {
      const outputDir = path.join(testDir, 'output-files');
      await WebAppGenerate.run(['--name', 'myApp', '--label', 'My App', '--output-dir', outputDir]);

      const webAppDir = path.join(outputDir, 'webApplications', 'myApp');
      expect(await fs.pathExists(path.join(webAppDir, 'package.json'))).to.be.true;
      expect(await fs.pathExists(path.join(webAppDir, 'README.md'))).to.be.true;
      expect(await fs.pathExists(path.join(webAppDir, 'src', 'index.js'))).to.be.true;
    });

    it('should remove .git directory from output', async () => {
      const outputDir = path.join(testDir, 'output-git');
      await WebAppGenerate.run(['--name', 'myApp', '--label', 'My App', '--output-dir', outputDir]);

      const webAppDir = path.join(outputDir, 'webApplications', 'myApp');
      expect(await fs.pathExists(path.join(webAppDir, '.git'))).to.be.false;
    });

    it('should return result with all expected properties', async () => {
      const outputDir = path.join(testDir, 'output-result');
      const result = await WebAppGenerate.run([
        '--name',
        'testApp',
        '--label',
        'Test Application',
        '--template',
        'react-basic',
        '--output-dir',
        outputDir,
      ]);

      expect(result).to.have.all.keys('name', 'label', 'template', 'outputDir');
      expect(result.name).to.equal('testApp');
      expect(result.label).to.equal('Test Application');
      expect(result.template).to.equal('react-basic');
      expect(result.outputDir).to.equal(path.join(outputDir, 'webApplications', 'testApp'));
    });
  });

  describe('--force flag behavior', () => {
    it('should remove existing directory and create new files with --force', async () => {
      const outputDir = path.join(testDir, 'output-force');
      const webAppDir = path.join(outputDir, 'webApplications', 'forceApp');

      // Create existing directory with old file
      await fs.ensureDir(webAppDir);
      await fs.writeFile(path.join(webAppDir, 'old-file.txt'), 'old content');

      await WebAppGenerate.run(['--name', 'forceApp', '--label', 'Force App', '--output-dir', outputDir, '--force']);

      // Old file gone, new files present
      expect(await fs.pathExists(path.join(webAppDir, 'old-file.txt'))).to.be.false;
      expect(await fs.pathExists(path.join(webAppDir, 'package.json'))).to.be.true;
    });
  });

  describe('clone failure handling', () => {
    it('should throw TemplateCloneError with descriptive message', async () => {
      const errorMessage = 'Network error: repository not found';
      const FailingCommand: typeof WebAppGenerateType = await esmock('../../../src/commands/webapp/generate.js', {
        'simple-git': createFailingMockSimpleGit(errorMessage),
      });

      try {
        await FailingCommand.run([
          '--name',
          'failApp',
          '--label',
          'Fail App',
          '--output-dir',
          path.join(testDir, 'output-fail'),
        ]);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect((error as Error).name).to.equal('TemplateCloneError');
        expect((error as Error).message).to.equal(`Failed to download template: ${errorMessage}`);
      }
    });
  });

  describe('output directory handling', () => {
    it('should create nested parent directories', async () => {
      const outputDir = path.join(testDir, 'deep', 'nested', 'path');

      await WebAppGenerate.run(['--name', 'nestedApp', '--label', 'Nested App', '--output-dir', outputDir]);

      expect(await fs.pathExists(path.join(outputDir, 'webApplications', 'nestedApp'))).to.be.true;
    });

    it('should resolve and return absolute path in result', async () => {
      const outputDir = path.join(testDir, 'absolute-test');
      const result = await WebAppGenerate.run([
        '--name',
        'absoluteApp',
        '--label',
        'Absolute App',
        '--output-dir',
        outputDir,
      ]);

      expect(path.isAbsolute(result.outputDir)).to.be.true;
    });
  });
});

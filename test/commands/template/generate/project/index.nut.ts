/*
 * Copyright (c) 2019, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';
import { expect } from 'chai';
import { TestSession, execCmd } from '@salesforce/cli-plugins-testkit';
import { Messages } from '@salesforce/core';
import assert from 'yeoman-assert';

const standardfolderarray = [
  'aura',
  'applications',
  'classes',
  'contentassets',
  'flexipages',
  'layouts',
  'objects',
  'permissionsets',
  'staticresources',
  'tabs',
  'triggers',
];
const filestocopy = ['.forceignore', '.gitignore', '.prettierignore', '.prettierrc', 'jest.config.js', 'package.json'];
const agentfilestocopy = filestocopy.filter((file) => file !== 'jest.config.js');
const emptyfolderarray = ['aura', 'lwc'];
const analyticsfolderarray = ['aura', 'classes', 'lwc', 'waveTemplates'];
const agentfolderarray = [
  'aiAuthoringBundles',
  'bots',
  'classes',
  'flows',
  'genAiPlannerBundles',
  'genAiPromptTemplates',
  'permissionsetgroups',
  'permissionsets',
];
const huskyhookarray = ['pre-commit'];
const vscodearray = ['extensions', 'launch', 'settings'];

Messages.importMessagesDirectory(path.dirname(url.fileURLToPath(import.meta.url)));
const messages = Messages.loadMessages('@salesforce/plugin-templates', 'messages');

describe('template generate project:', () => {
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

  describe('Check project creation', () => {
    it('should create project with default values and foo name', () => {
      execCmd('template generate project --projectname foo', { ensureExitCode: 0 });
      assert.file([path.join(session.project.dir, 'foo', 'config', 'project-scratch-def.json')]);
      assert.file([path.join(session.project.dir, 'foo', 'scripts', 'soql', 'account.soql')]);
      assert.file([path.join(session.project.dir, 'foo', 'scripts', 'apex', 'hello.apex')]);
      assert.file([path.join(session.project.dir, 'foo', 'README.md')]);
      assert.file([path.join(session.project.dir, 'foo', 'sfdx-project.json')]);
      assert.fileContent(path.join(session.project.dir, 'foo', 'sfdx-project.json'), '"namespace": "",');
      assert.fileContent(path.join(session.project.dir, 'foo', 'sfdx-project.json'), '"path": "force-app",');
      assert.fileContent(path.join(session.project.dir, 'foo', 'sfdx-project.json'), 'sourceApiVersion');
      assert.fileContent(
        path.join(session.project.dir, 'foo', 'sfdx-project.json'),
        '"sfdcLoginUrl": "https://login.salesforce.com"'
      );
      assert.fileContent(path.join(session.project.dir, 'foo', 'sfdx-project.json'), '"name": "foo"');

      // Check for Husky hooks
      for (const file of huskyhookarray) {
        assert.file([path.join(session.project.dir, 'foo', '.husky', file)]);
      }

      for (const file of vscodearray) {
        assert.file([path.join(session.project.dir, 'foo', '.vscode', `${file}.json`)]);
      }
      assert.fileContent(path.join(session.project.dir, 'foo', 'README.md'), messages.getMessage('StandardReadMe'));
      assert.file([path.join(session.project.dir, 'foo', 'eslint.config.js')]);
      assert.file([path.join(session.project.dir, 'foo', 'eslint.config.js')]);
      for (const file of filestocopy) {
        assert.file([path.join(session.project.dir, 'foo', file)]);
      }
      for (const folder of standardfolderarray) {
        assert(fs.existsSync(path.join(session.project.dir, 'foo', 'force-app', 'main', 'default', folder)));
      }
    });

    it('should create project with default values and foo name in a custom output directory with spaces in its name', () => {
      execCmd('template generate project --projectname foo --outputdir "test outputdir"', {
        ensureExitCode: 0,
      });
      assert.file([path.join(session.project.dir, 'test outputdir', 'foo', 'config', 'project-scratch-def.json')]);
      assert.file([path.join(session.project.dir, 'test outputdir', 'foo', 'README.md')]);
      assert.file([path.join(session.project.dir, 'test outputdir', 'foo', 'sfdx-project.json')]);
      for (const file of vscodearray) {
        assert.file([path.join(session.project.dir, 'test outputdir', 'foo', '.vscode', `${file}.json`)]);
      }
      assert.file([path.join(session.project.dir, 'test outputdir', 'foo', 'eslint.config.js')]);
      assert.file([path.join(session.project.dir, 'test outputdir', 'foo', 'eslint.config.js')]);
      for (const file of filestocopy) {
        assert.file([path.join(session.project.dir, 'test outputdir', 'foo', file)]);
      }
      for (const folder of standardfolderarray) {
        assert(
          fs.existsSync(path.join(session.project.dir, 'test outputdir', 'foo', 'force-app', 'main', 'default', folder))
        );
      }
    });

    it('should not create duplicate project in the directory where command is executed', () => {
      execCmd('template generate project --projectname duplicate-project-test --outputdir "test outputdir"', {
        ensureExitCode: 0,
      });
      assert.file(path.join(session.project.dir, 'test outputdir', 'duplicate-project-test', 'force-app'));
      assert.noFile(path.join(session.project.dir, '.', 'duplicate-project-test', 'force-app'));
    });

    it('should create project with default values and foo-project name in a custom output directory with spaces in its name', () => {
      execCmd('template generate project --projectname foo-project', { ensureExitCode: 0 });
      assert.file([path.join(session.project.dir, 'foo-project', 'config', 'project-scratch-def.json')]);
      assert.file([path.join(session.project.dir, 'foo-project', 'README.md')]);
      assert.file([path.join(session.project.dir, 'foo-project', 'sfdx-project.json')]);
      for (const file of vscodearray) {
        assert.file([path.join(session.project.dir, 'foo-project', '.vscode', `${file}.json`)]);
      }
      assert.file([path.join(session.project.dir, 'foo-project', 'eslint.config.js')]);
      for (const file of filestocopy) {
        assert.file([path.join(session.project.dir, 'foo-project', file)]);
      }
      for (const folder of standardfolderarray) {
        assert(fs.existsSync(path.join(session.project.dir, 'foo-project', 'force-app', 'main', 'default', folder)));
      }
    });

    it('should create a project with specified api version', () => {
      execCmd('template generate project --projectname apiVersionTest --api-version 50.0', {
        ensureExitCode: 0,
      });
      assert.fileContent(
        path.join(session.project.dir, 'apiVersionTest', 'sfdx-project.json'),
        '"sourceApiVersion": "50.0"'
      );
    });

    it('should create project with footest name and manifest folder', () => {
      execCmd('template generate project --projectname footest --manifest', { ensureExitCode: 0 });
      assert.file([path.join(session.project.dir, 'footest', 'manifest', 'package.xml')]);
    });

    it('should create project with fooempty name, empty template, empty default package directory, and a custom namespace', () => {
      execCmd(
        'template generate project --projectname fooempty --template empty --defaultpackagedir empty --namespace testnamespace',
        { ensureExitCode: 0 }
      );
      assert.file(path.join(session.project.dir, 'fooempty', '.forceignore'));
      assert.fileContent(
        path.join(session.project.dir, 'fooempty', 'sfdx-project.json'),
        '"namespace": "testnamespace",'
      );
      assert.fileContent(path.join(session.project.dir, 'fooempty', 'sfdx-project.json'), '"path": "empty",');
      assert.fileContent(path.join(session.project.dir, 'fooempty', 'sfdx-project.json'), 'sourceApiVersion');
      for (const folder of emptyfolderarray) {
        assert(fs.existsSync(path.join(session.project.dir, 'fooempty', 'empty', 'main', 'default', folder)));
      }
      assert.fileContent(
        path.join(session.project.dir, 'fooempty', 'README.md'),
        '# Salesforce DX Project: Next Steps'
      );
    });

    it('should create project with fooempty name, empty template, empty default package directory, empty namespace and custom login url', () => {
      execCmd(
        'template generate project --projectname fooempty --template empty --defaultpackagedir empty --loginurl https://vandelay-industries.my.salesforce.com',
        { ensureExitCode: 0 }
      );
      assert.file(path.join(session.project.dir, 'fooempty', '.forceignore'));
      assert.fileContent(path.join(session.project.dir, 'fooempty', 'sfdx-project.json'), '"namespace": "",');
      assert.fileContent(path.join(session.project.dir, 'fooempty', 'sfdx-project.json'), '"path": "empty",');
      assert.fileContent(path.join(session.project.dir, 'fooempty', 'sfdx-project.json'), 'sourceApiVersion');
      assert.fileContent(
        path.join(session.project.dir, 'fooempty', 'sfdx-project.json'),
        '"sfdcLoginUrl": "https://vandelay-industries.my.salesforce.com"'
      );
      for (const folder of emptyfolderarray) {
        assert(fs.existsSync(path.join(session.project.dir, 'fooempty', 'empty', 'main', 'default', folder)));
      }
      assert.fileContent(
        path.join(session.project.dir, 'fooempty', 'README.md'),
        '# Salesforce DX Project: Next Steps'
      );
    });

    it('should create project with analytics1 name using analytics template and a manifest', () => {
      execCmd('template generate project --projectname analytics1 --template analytics --manifest', {
        ensureExitCode: 0,
      });
      assert.file(path.join(session.project.dir, 'analytics1', '.forceignore'));
      assert.fileContent(path.join(session.project.dir, 'analytics1', 'sfdx-project.json'), '"path": "force-app",');
      assert.fileContent(path.join(session.project.dir, 'analytics1', 'sfdx-project.json'), 'sourceApiVersion');
      const srcDir = path.join(session.project.dir, 'analytics1', 'force-app', 'main', 'default');
      for (const folder of analyticsfolderarray) {
        const dir = path.join(srcDir, folder);
        assert(fs.existsSync(dir), `Missing ${dir}`);
      }

      // Check for Husky hooks
      for (const file of huskyhookarray) {
        assert.file([path.join(session.project.dir, 'foo', '.husky', file)]);
      }

      for (const file of vscodearray) {
        assert.file(path.join(session.project.dir, 'analytics1', '.vscode', `${file}.json`));
      }
      assert.fileContent(
        path.join(session.project.dir, 'analytics1', '.vscode', 'extensions.json'),
        '"salesforce.analyticsdx-vscode"'
      );
      assert.fileContent(
        path.join(session.project.dir, 'analytics1', '.vscode', 'extensions.json'),
        '"salesforce.salesforcedx-vscode"'
      );
      assert.fileContent(
        path.join(session.project.dir, 'analytics1', 'config', 'project-scratch-def.json'),
        '"DevelopmentWave"'
      );
      assert.fileContent(
        path.join(session.project.dir, 'analytics1', 'manifest', 'package.xml'),
        '<name>WaveTemplateBundle</name>'
      );
      assert.fileContent(
        path.join(session.project.dir, 'analytics1', 'README.md'),
        '# Salesforce DX Project: Next Steps'
      );
      assert.file([path.join(session.project.dir, 'analytics1', 'eslint.config.js')]);
      assert.file([path.join(session.project.dir, 'analytics1', 'eslint.config.js')]);
    });

    it('should create project with reactb2e template', () => {
      const projectName = 'react-b2e-test';
      const alphanumericName = 'reactb2etest';
      execCmd(`template generate project --projectname ${projectName} --template reactb2e`, {
        ensureExitCode: 0,
      });
      const projectDir = path.join(session.project.dir, projectName);
      assert.file([path.join(projectDir, 'sfdx-project.json')]);
      assert.fileContent(path.join(projectDir, 'sfdx-project.json'), 'sourceApiVersion');
      const webappMetaPath = path.join(
        projectDir,
        'force-app',
        'main',
        'default',
        'webapplications',
        alphanumericName,
        `${alphanumericName}.webapplication-meta.xml`
      );
      assert.file([webappMetaPath]);
      assert.fileContent(webappMetaPath, alphanumericName);
    });

    it('should create project with reactb2x template', () => {
      const projectName = 'react-b2x-test';
      const alphanumericName = 'reactb2xtest';
      execCmd(`template generate project --projectname ${projectName} --template reactb2x`, {
        ensureExitCode: 0,
      });
      const projectDir = path.join(session.project.dir, projectName);
      assert.file([path.join(projectDir, 'sfdx-project.json')]);
      assert.fileContent(path.join(projectDir, 'sfdx-project.json'), 'sourceApiVersion');
      const webappMetaPath = path.join(
        projectDir,
        'force-app',
        'main',
        'default',
        'webapplications',
        alphanumericName,
        `${alphanumericName}.webapplication-meta.xml`
      );
      assert.file([webappMetaPath]);
      assert.fileContent(webappMetaPath, alphanumericName);
    });

    it('should create project with agent template', () => {
      execCmd('template generate project --projectname agent1 --template agent --manifest', {
        ensureExitCode: 0,
      });
      const projectDir = path.join(session.project.dir, 'agent1');
      assert.file([path.join(projectDir, 'sfdx-project.json')]);
      assert.fileContent(path.join(projectDir, 'sfdx-project.json'), '"path": "force-app",');
      assert.fileContent(path.join(projectDir, 'sfdx-project.json'), 'sourceApiVersion');
      assert.file([path.join(projectDir, 'config', 'project-scratch-def.json')]);
      assert.fileContent(path.join(projectDir, 'config', 'project-scratch-def.json'), 'einsteinGptSettings');
      assert.file([path.join(projectDir, 'README.md')]);
      assert.fileContent(path.join(projectDir, 'README.md'), '# Agentforce Project');
      assert.file([path.join(projectDir, 'manifest', 'package.xml')]);
      assert.fileContent(path.join(projectDir, 'manifest', 'package.xml'), '<name>AiAuthoringBundle</name>');

      const srcDir = path.join(projectDir, 'force-app', 'main', 'default');
      for (const folder of agentfolderarray) {
        const dir = path.join(srcDir, folder);
        assert(fs.existsSync(dir), `Missing ${dir}`);
      }

      assert.file([
        path.join(srcDir, 'aiAuthoringBundles', 'Local_Info_Agent', 'Local_Info_Agent.bundle-meta.xml'),
        path.join(srcDir, 'aiAuthoringBundles', 'Local_Info_Agent', 'Local_Info_Agent.agent'),
        path.join(srcDir, 'classes', 'CheckWeather.cls'),
        path.join(srcDir, 'classes', 'CheckWeather.cls-meta.xml'),
        path.join(srcDir, 'classes', 'CurrentDate.cls'),
        path.join(srcDir, 'classes', 'CurrentDate.cls-meta.xml'),
        path.join(srcDir, 'classes', 'CurrentDateTest.cls'),
        path.join(srcDir, 'classes', 'CurrentDateTest.cls-meta.xml'),
        path.join(srcDir, 'classes', 'WeatherService.cls'),
        path.join(srcDir, 'classes', 'WeatherService.cls-meta.xml'),
        path.join(srcDir, 'classes', 'WeatherServiceTest.cls'),
        path.join(srcDir, 'classes', 'WeatherServiceTest.cls-meta.xml'),
        path.join(srcDir, 'flows', 'Get_Resort_Hours.flow-meta.xml'),
        path.join(srcDir, 'genAiPromptTemplates', 'Get_Event_Info.genAiPromptTemplate-meta.xml'),
        path.join(srcDir, 'permissionsets', 'Resort_Agent.permissionset-meta.xml'),
        path.join(srcDir, 'permissionsets', 'Resort_Admin.permissionset-meta.xml'),
        path.join(srcDir, 'permissionsetgroups', 'AFDX_Agent_Perms.permissionsetgroup-meta.xml'),
        path.join(srcDir, 'permissionsetgroups', 'AFDX_User_Perms.permissionsetgroup-meta.xml'),
      ]);

      for (const file of vscodearray) {
        assert.file(path.join(projectDir, '.vscode', `${file}.json`));
      }

      for (const file of agentfilestocopy) {
        assert.file([path.join(projectDir, file)]);
      }
    });
  });

  describe('TypeScript project creation', () => {
    it('should create TypeScript project with all required files', () => {
      execCmd('template generate project --projectname tsproject --lwc-language typescript', { ensureExitCode: 0 });

      // Verify standard files exist
      assert.file([path.join(session.project.dir, 'tsproject', 'config', 'project-scratch-def.json')]);
      assert.file([path.join(session.project.dir, 'tsproject', 'README.md')]);
      assert.file([path.join(session.project.dir, 'tsproject', 'sfdx-project.json')]);

      // Verify TypeScript-specific files exist
      assert.file([path.join(session.project.dir, 'tsproject', 'tsconfig.json')]);
      assert.file([path.join(session.project.dir, 'tsproject', 'package.json')]);
      assert.file([path.join(session.project.dir, 'tsproject', 'eslint.config.js')]);
      assert.file([path.join(session.project.dir, 'tsproject', '.forceignore')]);
      assert.file([path.join(session.project.dir, 'tsproject', '.gitignore')]);
    });

    it('should verify tsconfig.json has outDir: "dist" configuration', () => {
      execCmd('template generate project --projectname tsconfig-test --lwc-language typescript', { ensureExitCode: 0 });

      const tsconfigPath = path.join(session.project.dir, 'tsconfig-test', 'tsconfig.json');
      assert.file([tsconfigPath]);
      assert.fileContent(tsconfigPath, '"outDir": "dist"');
      assert.fileContent(tsconfigPath, '"rootDir": "."');
      assert.fileContent(tsconfigPath, '"include"');
      assert.fileContent(tsconfigPath, 'force-app/**/*.ts');
      assert.fileContent(tsconfigPath, '"exclude"');
      assert.fileContent(tsconfigPath, 'node_modules');
      assert.fileContent(tsconfigPath, 'dist');
    });

    it('should verify .forceignore excludes dist/ folder', () => {
      execCmd('template generate project --projectname forceignore-test --lwc-language typescript', {
        ensureExitCode: 0,
      });

      const forceignorePath = path.join(session.project.dir, 'forceignore-test', '.forceignore');
      assert.file([forceignorePath]);
      assert.fileContent(forceignorePath, 'dist/');
      assert.fileContent(forceignorePath, '**/dist/');
      assert.fileContent(forceignorePath, 'tsconfig.json');
    });

    it('should verify .gitignore excludes dist/ folder', () => {
      execCmd('template generate project --projectname gitignore-test --lwc-language typescript', {
        ensureExitCode: 0,
      });

      const gitignorePath = path.join(session.project.dir, 'gitignore-test', '.gitignore');
      assert.file([gitignorePath]);
      assert.fileContent(gitignorePath, 'dist/');
      assert.fileContent(gitignorePath, '*.tsbuildinfo');
    });

    it('should verify package.json has TypeScript dependencies', () => {
      execCmd('template generate project --projectname packagejson-test --lwc-language typescript', {
        ensureExitCode: 0,
      });

      const packageJsonPath = path.join(session.project.dir, 'packagejson-test', 'package.json');
      assert.file([packageJsonPath]);
      assert.fileContent(packageJsonPath, '"typescript"');
      assert.fileContent(packageJsonPath, '"@typescript-eslint/eslint-plugin"');
      assert.fileContent(packageJsonPath, '"@typescript-eslint/parser"');
      assert.fileContent(packageJsonPath, '"@types/jest"');
      assert.fileContent(packageJsonPath, '"build": "tsc"');
      assert.fileContent(packageJsonPath, '"build:watch": "tsc --watch"');
    });

    it('should verify sfdx-project.json includes defaultLWCLanguage field', () => {
      execCmd('template generate project --projectname sfdx-test --lwc-language typescript', { ensureExitCode: 0 });

      const sfdxProjectPath = path.join(session.project.dir, 'sfdx-test', 'sfdx-project.json');
      assert.file([sfdxProjectPath]);
      assert.fileContent(sfdxProjectPath, '"defaultLWCLanguage": "typescript"');
    });

    it('should verify ESLint config uses TypeScript parser for both JS and TS', () => {
      execCmd('template generate project --projectname eslint-test --lwc-language typescript', { ensureExitCode: 0 });

      const eslintConfigPath = path.join(session.project.dir, 'eslint-test', 'eslint.config.js');
      assert.file([eslintConfigPath]);
      assert.fileContent(eslintConfigPath, "files: ['**/lwc/**/*.{js,ts}']");
      assert.fileContent(eslintConfigPath, 'parser: tsparser');
      assert.fileContent(eslintConfigPath, '@typescript-eslint');
    });

    it('should create JavaScript project without TypeScript files when using javascript flag', () => {
      execCmd('template generate project --projectname jsproject --lwc-language javascript', { ensureExitCode: 0 });

      // TypeScript files should NOT exist
      assert.noFile([path.join(session.project.dir, 'jsproject', 'tsconfig.json')]);

      // Standard files should exist
      assert.file([path.join(session.project.dir, 'jsproject', 'package.json')]);
      assert.file([path.join(session.project.dir, 'jsproject', 'eslint.config.js')]);

      // Verify sfdx-project.json has javascript as default
      const sfdxProjectPath = path.join(session.project.dir, 'jsproject', 'sfdx-project.json');
      assert.fileContent(sfdxProjectPath, '"defaultLWCLanguage": "javascript"');

      // Verify package.json does NOT have TypeScript dependencies
      const packageJsonPath = path.join(session.project.dir, 'jsproject', 'package.json');
      const packageContent = fs.readFileSync(packageJsonPath, 'utf8');
      expect(packageContent).to.not.contain('typescript');
      expect(packageContent).to.not.contain('@typescript-eslint');
    });

    it('should create default project without TypeScript files when no flag specified', () => {
      execCmd('template generate project --projectname defaultproject', { ensureExitCode: 0 });

      // TypeScript files should NOT exist
      assert.noFile([path.join(session.project.dir, 'defaultproject', 'tsconfig.json')]);

      // sfdx-project.json should NOT have defaultLWCLanguage field
      const sfdxProjectPath = path.join(session.project.dir, 'defaultproject', 'sfdx-project.json');
      const sfdxContent = fs.readFileSync(sfdxProjectPath, 'utf8');
      expect(sfdxContent).to.not.contain('defaultLWCLanguage');
    });

    it('should create TypeScript project with empty template including full toolchain', () => {
      execCmd('template generate project --projectname empty-ts --template empty --lwc-language typescript', {
        ensureExitCode: 0,
      });

      const projectDir = path.join(session.project.dir, 'empty-ts');

      // Verify TypeScript-specific files exist
      assert.file([path.join(projectDir, 'tsconfig.json')]);
      assert.file([path.join(projectDir, 'package.json')]);
      assert.file([path.join(projectDir, 'eslint.config.js')]);
      assert.file([path.join(projectDir, '.forceignore')]);
      assert.file([path.join(projectDir, '.gitignore')]);

      // Verify Husky hooks exist for empty template
      for (const file of huskyhookarray) {
        assert.file([path.join(projectDir, '.husky', file)]);
      }

      // Verify VSCode config files exist
      for (const file of vscodearray) {
        assert.file([path.join(projectDir, '.vscode', `${file}.json`)]);
      }

      // Verify sfdx-project.json includes defaultLWCLanguage
      const sfdxProjectPath = path.join(projectDir, 'sfdx-project.json');
      assert.fileContent(sfdxProjectPath, '"defaultLWCLanguage": "typescript"');

      // Verify package.json has TypeScript dependencies
      const packageJsonPath = path.join(projectDir, 'package.json');
      assert.fileContent(packageJsonPath, '"typescript"');
      assert.fileContent(packageJsonPath, '"build": "tsc"');

      // Verify empty template folders exist
      for (const folder of emptyfolderarray) {
        assert(fs.existsSync(path.join(projectDir, 'force-app', 'main', 'default', folder)));
      }
    });
  });

  describe('project creation failures', () => {
    it('should throw missing required flag error', () => {
      const stderr = execCmd('template generate project').shellOutput.stderr;
      expect(stderr).to.contain('Missing required flag');
    });

    it('should throw invalid template name error', () => {
      const stderr = execCmd('template generate project --projectname foo --template foo').shellOutput.stderr;
      expect(stderr).to.contain(messages.getMessage('InvalidTemplate'));
    });

    it('should throw error for invalid lwc-language value', () => {
      const stderr = execCmd('template generate project --projectname foo --lwc-language python').shellOutput.stderr;
      expect(stderr).to.contain('Expected --lwc-language');
      expect(stderr).to.match(/(javascript|typescript)/);
    });
  });
});

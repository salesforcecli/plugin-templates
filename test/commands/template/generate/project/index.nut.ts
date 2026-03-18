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
      assert.fileContent(path.join(projectDir, 'manifest', 'package.xml'), '<name>GenAiPlugin</name>');

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

      for (const file of huskyhookarray) {
        assert.file([path.join(projectDir, '.husky', file)]);
      }

      for (const file of vscodearray) {
        assert.file(path.join(projectDir, '.vscode', `${file}.json`));
      }

      assert.file([path.join(projectDir, 'eslint.config.js')]);

      for (const file of filestocopy) {
        assert.file([path.join(projectDir, file)]);
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
  });
});

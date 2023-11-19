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
const huskyhookarray = ['pre-commit'];
const vscodearray = ['extensions', 'launch', 'settings'];

Messages.importMessagesDirectory(path.dirname(url.fileURLToPath(import.meta.url)));
const messages = Messages.loadMessages('@salesforce/plugin-templates', 'messages');

describe('Project creation tests:', () => {
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
      execCmd('force:project:create --projectname foo', { ensureExitCode: 0 });
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
      assert.file([path.join(session.project.dir, 'foo', 'force-app', 'main', 'default', 'lwc', '.eslintrc.json')]);
      assert.file([path.join(session.project.dir, 'foo', 'force-app', 'main', 'default', 'aura', '.eslintrc.json')]);
      for (const file of filestocopy) {
        assert.file([path.join(session.project.dir, 'foo', file)]);
      }
      for (const folder of standardfolderarray) {
        assert(fs.existsSync(path.join(session.project.dir, 'foo', 'force-app', 'main', 'default', folder)));
      }
    });

    it('should create project with default values and foo name in a custom output directory with spaces in its name', () => {
      execCmd('force:project:create --projectname foo --outputdir "test outputdir"', { ensureExitCode: 0 });
      assert.file([path.join(session.project.dir, 'test outputdir', 'foo', 'config', 'project-scratch-def.json')]);
      assert.file([path.join(session.project.dir, 'test outputdir', 'foo', 'README.md')]);
      assert.file([path.join(session.project.dir, 'test outputdir', 'foo', 'sfdx-project.json')]);
      for (const file of vscodearray) {
        assert.file([path.join(session.project.dir, 'test outputdir', 'foo', '.vscode', `${file}.json`)]);
      }
      assert.file([
        path.join(
          session.project.dir,
          'test outputdir',
          'foo',
          'force-app',
          'main',
          'default',
          'lwc',
          '.eslintrc.json'
        ),
      ]);
      assert.file([
        path.join(
          session.project.dir,
          'test outputdir',
          'foo',
          'force-app',
          'main',
          'default',
          'aura',
          '.eslintrc.json'
        ),
      ]);
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
      execCmd('force:project:create --projectname duplicate-project-test --outputdir "test outputdir"', {
        ensureExitCode: 0,
      });
      assert.file(path.join(session.project.dir, 'test outputdir', 'duplicate-project-test', 'force-app'));
      assert.noFile(path.join(session.project.dir, '.', 'duplicate-project-test', 'force-app'));
    });

    it('should create project with default values and foo-project name in a custom output directory with spaces in its name', () => {
      execCmd('force:project:create --projectname foo-project', { ensureExitCode: 0 });
      assert.file([path.join(session.project.dir, 'foo-project', 'config', 'project-scratch-def.json')]);
      assert.file([path.join(session.project.dir, 'foo-project', 'README.md')]);
      assert.file([path.join(session.project.dir, 'foo-project', 'sfdx-project.json')]);
      for (const file of vscodearray) {
        assert.file([path.join(session.project.dir, 'foo-project', '.vscode', `${file}.json`)]);
      }
      assert.file([
        path.join(session.project.dir, 'foo-project', 'force-app', 'main', 'default', 'lwc', '.eslintrc.json'),
      ]);
      for (const file of filestocopy) {
        assert.file([path.join(session.project.dir, 'foo-project', file)]);
      }
      for (const folder of standardfolderarray) {
        assert(fs.existsSync(path.join(session.project.dir, 'foo-project', 'force-app', 'main', 'default', folder)));
      }
    });

    it('should create a project with specified api version', () => {
      execCmd('force:project:create --projectname apiVersionTest --api-version 50.0', { ensureExitCode: 0 });
      assert.fileContent(
        path.join(session.project.dir, 'apiVersionTest', 'sfdx-project.json'),
        '"sourceApiVersion": "50.0"'
      );
    });

    it('should create project with footest name and manifest folder', () => {
      execCmd('force:project:create --projectname footest --manifest', { ensureExitCode: 0 });
      assert.file([path.join(session.project.dir, 'footest', 'manifest', 'package.xml')]);
    });

    it('should create project with fooempty name, empty template, empty default package directory, and a custom namespace', () => {
      execCmd(
        'force:project:create --projectname fooempty --template empty --defaultpackagedir empty --namespace testnamespace',
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
        'force:project:create --projectname fooempty --template empty --defaultpackagedir empty --loginurl https://vandelay-industries.my.salesforce.com',
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
      execCmd('force:project:create --projectname analytics1 --template analytics --manifest', { ensureExitCode: 0 });
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
      assert.file([path.join(srcDir, 'lwc', '.eslintrc.json')]);
      assert.file([path.join(srcDir, 'aura', '.eslintrc.json')]);
    });
  });

  describe('project creation failures', () => {
    it('should throw invalid template name error', () => {
      const stderr = execCmd('force:project:create').shellOutput.stderr;
      expect(stderr).to.contain('Missing required flag');
    });

    it('should throw invalid template name error', () => {
      const stderr = execCmd('force:project:create --projectname foo --template foo').shellOutput.stderr;
      expect(stderr).to.contain(messages.getMessage('InvalidTemplate'));
    });
  });
});

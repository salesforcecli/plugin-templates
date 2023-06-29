/*
 * Copyright (c) 2019, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import * as path from 'path';
import * as fs from 'fs';
import { expect, config } from 'chai';
import { TestSession, execCmd } from '@salesforce/cli-plugins-testkit';
import { Messages } from '@salesforce/core';
import { nls } from '@salesforce/templates/lib/i18n';
import * as assert from 'yeoman-assert';

Messages.importMessagesDirectory(__dirname);
const messages = Messages.loadMessages('@salesforce/plugin-templates', 'messages');

config.truncateThreshold = 0;

describe('Lightning app creation tests:', () => {
  let session: TestSession;
  before(async () => {
    session = await TestSession.create({
      project: {
        gitClone: 'https://github.com/trailheadapps/dreamhouse-lwc.git',
      },
      scratchOrgs: [{ setDefault: true, config: path.join('config', 'project-scratch-def.json') }],
      devhubAuthStrategy: 'AUTO',
    });
  });
  after(async () => {
    await session?.clean();
  });

  const fileFormatter = (pathway: string, filename: string): string[] =>
    ['.app', '.auradoc', '.css', 'Controller.js', 'Helper.js', 'Renderer.js', '.svg'].map((suffix) =>
      path.join(session.project.dir, 'aura', pathway, filename + suffix)
    );

  it('round-trips to the server with consistent file formatting', () => {
    const testDir = path.join(session.project.dir, 'force-app', 'main', 'default', 'aura', 'testApp');
    const testFile = (file: string) => path.join(testDir, file);

    execCmd(
      `lightning:generate:app --name testApp --template DefaultLightningApp --output-dir ${path.join(
        'force-app',
        'main',
        'default',
        'aura'
      )}`,
      { ensureExitCode: 0 }
    );

    const testAppContent = `<aura:application>

</aura:application>\t
`;
    const testAuradocContent = `<aura:documentation>
\t<aura:description>Documentation</aura:description>
\t<aura:example name="ExampleName" ref="exampleComponentName" label="Label">
\t\tExample Description
\t</aura:example>
</aura:documentation>`;

    expect(fs.readFileSync(testFile('testApp.app'), 'utf8')).to.equal(testAppContent);
    expect(fs.readFileSync(testFile('testApp.auraDoc'), 'utf8')).to.equal(testAuradocContent);

    // deploy and retrieve it from the org
    execCmd(`project:deploy:start --source-dir ${testDir}`, {
      ensureExitCode: 0,
    });
    execCmd(`project:retrieve:start --source-dir ${testDir}`, {
      ensureExitCode: 0,
    });
    expect(fs.readFileSync(testFile('testApp.app'), 'utf8')).to.equal(testAppContent);
    expect(fs.readFileSync(testFile('testApp.auraDoc'), 'utf8')).to.equal(testAuradocContent);
  });

  describe('Check lightning app creation', () => {
    const name = 'foo';
    it('should create lightning app foo using DefaultLightningApp template', () => {
      execCmd(`force:lightning:app:create --appname ${name} --outputdir aura --template DefaultLightningApp`, {
        ensureExitCode: 0,
      });
      assert.file(fileFormatter(name, name));
      assert.file(path.join(session.project.dir, 'aura', name, 'foo.app-meta.xml'));
      assert.fileContent(
        path.join(session.project.dir, 'aura', name, 'foo.app'),
        '<aura:application>\n\n</aura:application>'
      );
      assert.fileContent(
        path.join(session.project.dir, 'aura', name, 'foo.app-meta.xml'),
        '<AuraDefinitionBundle xmlns="http://soap.sforce.com/2006/04/metadata">'
      );
    });

    it('should create lightning app foo in a new directory without the -meta.xml file', () => {
      execCmd(`force:lightning:app:create --appname foo --outputdir ${path.join('aura', 'testing')} --internal`, {
        ensureExitCode: 0,
      });
      assert.file(fileFormatter(path.join('testing', name), name));
    });
  });
  describe('lightning app failures', () => {
    it('should throw invalid template name error', () => {
      const stderr = execCmd('force:lightning:app:create --appname foo --outputdir aura --template foo').shellOutput
        .stderr;
      expect(stderr).to.contain(messages.getMessage('InvalidTemplate'));
    });

    it('should throw missing aura parent folder error', () => {
      const stderr = execCmd('force:lightning:app:create --appname foo').shellOutput.stderr;
      expect(stderr).to.contain(messages.getMessage('MissingAuraFolder'));
    });

    it('should throw missing appname error', () => {
      const stderr = execCmd('force:lightning:app:create --outputdir aura').shellOutput.stderr;
      expect(stderr).to.contain('Missing required flag');
    });

    it('should throw invalid non alphanumeric appname error', () => {
      const stderr = execCmd('force:lightning:app:create --appname /a --outputdir aura').shellOutput.stderr;
      expect(stderr).to.contain(nls.localize('AlphaNumericNameError'));
    });

    it('should throw invalid appname starting with numeric error', () => {
      const stderr = execCmd('force:lightning:app:create --appname 3aa --outputdir aura').shellOutput.stderr;
      expect(stderr).to.contain(nls.localize('NameMustStartWithLetterError'));
    });

    it('should throw invalid appname ending with underscore error', () => {
      const stderr = execCmd('force:lightning:app:create --appname a_ --outputdir aura').shellOutput.stderr;
      expect(stderr).to.contain(nls.localize('EndWithUnderscoreError'));
    });

    it('should throw invalid appname with double underscore error', () => {
      const stderr = execCmd('force:lightning:app:create --appname a__a --outputdir aura').shellOutput.stderr;
      expect(stderr).to.contain(nls.localize('DoubleUnderscoreError'));
    });
  });
});

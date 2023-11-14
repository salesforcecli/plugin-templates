/*
 * Copyright (c) 2019, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import path from 'node:path';
import url from 'node:url';
import { expect, config } from 'chai';
import { TestSession, execCmd } from '@salesforce/cli-plugins-testkit';
import { Messages } from '@salesforce/core';
import assert from 'yeoman-assert';

Messages.importMessagesDirectory(path.dirname(url.fileURLToPath(import.meta.url)));
const messages = Messages.loadMessages('@salesforce/plugin-templates', 'messages');

config.truncateThreshold = 0;

describe('Lightning component creation tests:', () => {
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

  const fileFormatter = (pathway: string, filename: string): string[] =>
    ['.cmp', '.auradoc', '.css', 'Controller.js', 'Helper.js', 'Renderer.js', '.svg', '.design'].map((suffix) =>
      path.join(session.project.dir, 'aura', pathway, filename + suffix)
    );

  describe('Check lightning aura components creation', () => {
    it('should create lightning aura component files in the aura output directory', () => {
      execCmd('force:lightning:component:create --componentname foo --outputdir aura', { ensureExitCode: 0 });
      assert.file(fileFormatter('foo', 'foo'));
      assert.file(path.join(session.project.dir, 'aura', 'foo', 'foo.cmp-meta.xml'));
      assert.fileContent(
        path.join(session.project.dir, 'aura', 'foo', 'foo.cmp-meta.xml'),
        '<AuraDefinitionBundle xmlns="http://soap.sforce.com/2006/04/metadata">'
      );
    });

    it('should create lightning aura component files from default template in the aura output directory', () => {
      execCmd('force:lightning:component:create --componentname foo --outputdir aura --template default', {
        ensureExitCode: 0,
      });
      assert.file(fileFormatter('foo', 'foo'));
      assert.file(path.join(session.project.dir, 'aura', 'foo', 'foo.cmp-meta.xml'));
      assert.fileContent(
        path.join(session.project.dir, 'aura', 'foo', 'foo.cmp-meta.xml'),
        '<AuraDefinitionBundle xmlns="http://soap.sforce.com/2006/04/metadata">'
      );
    });
  });

  describe('Check lightning aura components creation without -meta.xml file', () => {
    it('should create lightning aura component files in the aura output directory without a -meta.xml file', () => {
      execCmd('force:lightning:component:create --componentname internalflagtest --outputdir aura --internal', {
        ensureExitCode: 0,
      });
      assert.file(fileFormatter('internalflagtest', 'internalflagtest'));
      assert.noFile(path.join(session.project.dir, 'aura', 'internalflagtest', 'internalflagtest.cmp-meta.xml'));
    });
  });

  describe('Check lightning web components creation without -meta-xml file', () => {
    it('should create lightning web component files in the lwc output directory with the internal flag for disabling -meta.xml files', () => {
      execCmd(
        'force:lightning:component:create --componentname internallwctest --outputdir lwc --type lwc --internal',
        { ensureExitCode: 0 }
      );
      assert.noFile(path.join(session.project.dir, 'lwc', 'internallwctest', 'internallwctest.js-meta.xml'));
      assert.file(path.join(session.project.dir, 'lwc', 'internallwctest', 'internallwctest.html'));
      assert.file(path.join(session.project.dir, 'lwc', 'internallwctest', 'internallwctest.js'));
      assert.fileContent(
        path.join(session.project.dir, 'lwc', 'internallwctest', 'internallwctest.js'),
        'export default class Internallwctest extends LightningElement {}'
      );
    });
  });

  describe('Check lightning web components creation with -meta-xml file', () => {
    it('should create lightning web component files in the lwc output directory', () => {
      execCmd('force:lightning:component:create --componentname foo --outputdir lwc --type lwc', { ensureExitCode: 0 });
      assert.file(path.join(session.project.dir, 'lwc', 'foo', 'foo.js-meta.xml'));
      assert.file(path.join(session.project.dir, 'lwc', 'foo', 'foo.html'));
      assert.file(path.join(session.project.dir, 'lwc', 'foo', 'foo.js'));
      assert.fileContent(
        path.join(session.project.dir, 'lwc', 'foo', 'foo.js'),
        'export default class Foo extends LightningElement {}'
      );
    });

    it('should create lightning web component files from default template in the lwc output directory', () => {
      execCmd('force:lightning:component:create --componentname foo --outputdir lwc --type lwc --template default', {
        ensureExitCode: 0,
      });
      assert.file(path.join(session.project.dir, 'lwc', 'foo', 'foo.js-meta.xml'));
      assert.file(path.join(session.project.dir, 'lwc', 'foo', 'foo.html'));
      assert.file(path.join(session.project.dir, 'lwc', 'foo', 'foo.js'));
      assert.fileContent(
        path.join(session.project.dir, 'lwc', 'foo', 'foo.js'),
        'export default class Foo extends LightningElement {}'
      );
    });
  });

  describe('Check analytics dashboard lwc creation', () => {
    it('should create analyticsDashboard lwc files in the lwc output directory', () => {
      execCmd(
        'force:lightning:component:create --componentname foo --outputdir lwc --type lwc --template analyticsDashboard',
        { ensureExitCode: 0 }
      );
      const jsFile = path.join(session.project.dir, 'lwc', 'foo', 'foo.js');
      const metaFile = path.join(session.project.dir, 'lwc', 'foo', 'foo.js-meta.xml');
      assert.file(metaFile);
      assert.file(path.join(session.project.dir, 'lwc', 'foo', 'foo.html'));
      assert.file(jsFile);
      assert.fileContent(metaFile, '<masterLabel>Foo</masterLabel>');
      assert.fileContent(metaFile, '<target>analytics__Dashboard</target>');
      assert.fileContent(metaFile, 'targets="analytics__Dashboard"');
      assert.fileContent(metaFile, '<hasStep>false</hasStep>');
      assert.fileContent(jsFile, 'export default class Foo extends LightningElement {');
      assert.fileContent(jsFile, '@api getState;');
      assert.fileContent(jsFile, '@api setState;');
      assert.fileContent(jsFile, '@api refresh;');
      assert.fileContent(jsFile, '@api stateChangedCallback(prevState, newState)');
    });

    it('should create analyticsDashboardWithStep lwc files in the lwc output directory', () => {
      execCmd(
        'force:lightning:component:create --componentname fooWithStep --outputdir lwc --type lwc --template analyticsDashboardWithStep',
        { ensureExitCode: 0 }
      );
      const jsFile = path.join(session.project.dir, 'lwc', 'fooWithStep', 'fooWithStep.js');
      const metaFile = path.join(session.project.dir, 'lwc', 'fooWithStep', 'fooWithStep.js-meta.xml');
      assert.file(metaFile);
      assert.file(path.join(session.project.dir, 'lwc', 'fooWithStep', 'fooWithStep.html'));
      assert.file(jsFile);
      assert.fileContent(metaFile, '<masterLabel>Foo With Step</masterLabel>');
      assert.fileContent(metaFile, '<target>analytics__Dashboard</target>');
      assert.fileContent(metaFile, 'targets="analytics__Dashboard"');
      assert.fileContent(metaFile, '<hasStep>true</hasStep>');
      assert.fileContent(jsFile, 'export default class FooWithStep extends LightningElement {');
      assert.fileContent(jsFile, '@api getState;');
      assert.fileContent(jsFile, '@api setState;');
      assert.fileContent(jsFile, '@api refresh;');
      assert.fileContent(jsFile, '@api results;');
      assert.fileContent(jsFile, '@api metadata;');
      assert.fileContent(jsFile, '@api selection;');
      assert.fileContent(jsFile, '@api setSelection;');
      assert.fileContent(jsFile, '@api selectMode;');
      assert.fileContent(jsFile, '@api stateChangedCallback(prevState, newState)');
    });
  });

  describe('lightning component failures', () => {
    it('should throw missing component name error', () => {
      const stderr = execCmd('force:lightning:component:create --outputdir aura').shellOutput.stderr;
      expect(stderr).to.contain('Missing required flag');
    });

    it('should throw missing aura parent folder error', () => {
      const stderr = execCmd('force:lightning:component:create --componentname foo').shellOutput.stderr;
      expect(stderr).to.contain(messages.getMessage('MissingAuraFolder'));
    });

    it('should throw missing lwc parent folder error', () => {
      const stderr = execCmd('force:lightning:component:create --componentname foo --type lwc').shellOutput.stderr;
      expect(stderr).to.contain(messages.getMessage('MissingLWCFolder'));
    });

    it('should throw invalid template error', () => {
      const stderr = execCmd(
        'force:lightning:component:create --outputdir lwc --componentname foo --type lwc --template foo'
      ).shellOutput.stderr;
      expect(stderr).to.contain(messages.getMessage('InvalidTemplate'));
    });

    it('should throw missing template error', () => {
      const stderr = execCmd(
        'force:lightning:component:create --outputdir aura --componentname foo --type aura --template analyticsDashboard'
      ).shellOutput.stderr;
      expect(stderr).to.contain(
        messages.getMessage('MissingLightningComponentTemplate', ['analyticsDashboard', 'aura'])
      );
    });
  });
});

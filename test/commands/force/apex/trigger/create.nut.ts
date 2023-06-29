/*
 * Copyright (c) 2019, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import * as path from 'path';
import * as fs from 'fs';
import { expect } from 'chai';
import { TestSession, execCmd } from '@salesforce/cli-plugins-testkit';
import { nls } from '@salesforce/templates/lib/i18n';
import * as assert from 'yeoman-assert';

describe('Apex trigger creation tests:', () => {
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

  it('round-trips to the server with consistent file formatting', () => {
    const triggerPath = path.join('force-app', 'main', 'default', 'triggers', 'foo.trigger');
    execCmd(
      `force:apex:trigger:create --name foo --sobject ACCOUNT --output-dir ${path.join(
        'force-app',
        'main',
        'default',
        'triggers'
      )}`,
      { ensureExitCode: 0 }
    );
    assert.file(
      [triggerPath, path.join('force-app', 'main', 'default', 'triggers', 'foo.trigger-meta.xml')].map((f) =>
        path.join(session.project.dir, f)
      )
    );
    const content = `trigger foo on ACCOUNT (before insert) {

}`;
    expect(fs.readFileSync(path.join(session.project.dir, triggerPath), 'utf8')).to.equal(content);

    // deploy and retrieve it from the org
    execCmd(`project:deploy:start --source-dir ${triggerPath}`, {
      ensureExitCode: 0,
    });
    execCmd(`project:retrieve:start --source-dir ${triggerPath}`, {
      ensureExitCode: 0,
    });
    expect(fs.readFileSync(path.join(session.project.dir, triggerPath), 'utf8')).to.equal(content);
  });

  describe('Check apex trigger creation', () => {
    it('should create foo trigger using ApexTrigger template and default output directory', () => {
      execCmd('force:apex:trigger:create --triggername foo', { ensureExitCode: 0 });
      assert.file(['foo.trigger', 'foo.trigger-meta.xml'].map((f) => path.join(session.project.dir, f)));
      assert.fileContent(path.join(session.project.dir, 'foo.trigger'), 'trigger foo on SOBJECT (before insert)');
    });

    it('should create foo trigger with a targetpath and sobject set', () => {
      execCmd('force:apex:trigger:create --triggername foo --sobject customsobject --outputdir apextriggertestfolder', {
        ensureExitCode: 0,
      });
      assert.file(
        [
          path.join('apextriggertestfolder', 'foo.trigger'),
          path.join('apextriggertestfolder', 'foo.trigger-meta.xml'),
        ].map((f) => path.join(session.project.dir, f))
      );
      assert.fileContent(
        path.join(session.project.dir, 'apextriggertestfolder', 'foo.trigger'),
        'trigger foo on customsobject (before insert)'
      );
    });

    it('should override foo trigger with a different sobject and triggerevent', () => {
      execCmd('force:apex:trigger:create --triggername foo --sobject override --triggerevents "after insert"', {
        ensureExitCode: 0,
      });
      assert.file(['foo.trigger', 'foo.trigger-meta.xml'].map((f) => path.join(session.project.dir, f)));
      assert.fileContent(path.join(session.project.dir, 'foo.trigger'), 'trigger foo on override (after insert)');
    });

    it('should create foo trigger in custom folder name that has a space in it', () => {
      execCmd('force:apex:trigger:create --triggername foo --outputdir "classes create"', { ensureExitCode: 0 });
      assert.file(
        [path.join('classes create', 'foo.trigger'), path.join('classes create', 'foo.trigger-meta.xml')].map((f) =>
          path.join(session.project.dir, f)
        )
      );
      assert.fileContent(
        path.join(session.project.dir, 'classes create', 'foo.trigger'),
        'trigger foo on SOBJECT (before insert)'
      );
    });
  });
  describe('Check that all invalid name errors are thrown', () => {
    it('should throw a missing trigger name error', () => {
      const stderr = execCmd('force:apex:trigger:create').shellOutput.stderr;
      expect(stderr).to.contain('Missing required flag');
    });

    it('should throw invalid non alphanumeric trigger name error', () => {
      const stderr = execCmd('force:apex:trigger:create --triggername /a').shellOutput.stderr;
      expect(stderr).to.contain(nls.localize('AlphaNumericNameError'));
    });

    it('should throw invalid trigger name starting with numeric error', () => {
      const stderr = execCmd('force:apex:trigger:create --triggername 3aa').shellOutput.stderr;
      expect(stderr).to.contain(nls.localize('NameMustStartWithLetterError'));
    });

    it('should throw invalid trigger name ending with underscore error', () => {
      const stderr = execCmd('force:apex:trigger:create --triggername a_').shellOutput.stderr;
      expect(stderr).to.contain(nls.localize('EndWithUnderscoreError'));
    });

    it('should throw invalid trigger name with double underscore error', () => {
      const stderr = execCmd('force:apex:trigger:create --triggername a__a').shellOutput.stderr;
      expect(stderr).to.contain(nls.localize('DoubleUnderscoreError'));
    });
  });
});

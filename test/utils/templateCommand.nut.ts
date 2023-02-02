/*
 * Copyright (c) 2019, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import * as path from 'path';
import { OrgConfigProperties } from '@salesforce/core';
import { TestSession, execCmd } from '@salesforce/cli-plugins-testkit';
import * as assert from 'yeoman-assert';

import { nls } from '@salesforce/templates/lib/i18n';
import { expect, config } from 'chai';
import { CreateOutput } from '@salesforce/templates';

config.truncateThreshold = 0;

describe('TemplateCommand', () => {
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

  describe('output', () => {
    it('should log basic output when json flag is not specified', () => {
      const stdout = execCmd('force:apex:class:create --classname foo', { ensureExitCode: 0 }).shellOutput.stdout;
      expect(stdout).to.include(`target dir = ${session.project.dir}`);
      expect(stdout).to.include('create foo.cls');
      expect(stdout).to.include('create foo.cls-meta.xml');
    });

    it('should log json output when flag is specified', () => {
      const result = execCmd<CreateOutput>('force:apex:class:create --classname foo --json', { ensureExitCode: 0 })
        .jsonOutput?.result;
      expect(result).to.be.an('object');
      assert(result);
      expect(result).to.haveOwnProperty('outputDir');
      expect(result.outputDir).to.equal(session.project.dir);
      expect(result).to.haveOwnProperty('created');
      expect(result.created).to.be.an('array').that.is.empty;
      expect(result).to.haveOwnProperty('rawOutput');
      expect(result.rawOutput).to.equal(
        `target dir = ${session.project.dir}\nidentical foo.cls\nidentical foo.cls-meta.xml\n`
      );
    });
  });

  describe('Custom templates', () => {
    const LOCAL_CUSTOM_TEMPLATES = path.join(__dirname, '../../../test/custom-templates');
    const TEST_CUSTOM_TEMPLATES_REPO =
      'https://github.com/forcedotcom/salesforcedx-templates/tree/main/test/custom-templates';
    const NON_EXISTENT_LOCAL_PATH = 'this-folder-does-not-exist';
    const NON_EXISTENT_REPO = 'https://github.com/forcedotcom/this-repo-does-not-exist';
    const INVALID_URL_REPO = 'https://github.com/forcedotcom/salesforcedx-templates/invalid-url';
    const HTTP_REPO = 'http://github.com/forcedotcom/salesforcedx-templates/tree/main/test/custom-templates';
    const GITLAB_REPO = 'https://gitlab.com/forcedotcom/salesforcedx-templates/tree/main/test/custom-templates';

    it.only('should create custom template from git repo', () => {
      execCmd(`config:set ${OrgConfigProperties.ORG_CUSTOM_METADATA_TEMPLATES}=${TEST_CUSTOM_TEMPLATES_REPO}`);
      execCmd('force:apex:class:create --classname foo', { ensureExitCode: 0 });
      assert.file(['foo.cls', 'foo.cls-meta.xml'].map((f) => path.join(session.project.dir, f)));
      assert.fileContent(path.join(session.project.dir, 'foo.cls'), 'public with sharing class foo');
    });

    it('should create from default template if git repo templates do not have the template type', () => {
      execCmd(`config:set ${OrgConfigProperties.ORG_CUSTOM_METADATA_TEMPLATES}=${TEST_CUSTOM_TEMPLATES_REPO}`);

      execCmd('force:lightning:component:create --componentname foo --outputdir lwc --type lwc', { ensureExitCode: 0 });
      assert.file(path.join(session.project.dir, 'lwc', 'foo', 'foo.js-meta.xml'));
      assert.file(path.join(session.project.dir, 'lwc', 'foo', 'foo.html'));
      assert.file(path.join(session.project.dir, 'lwc', 'foo', 'foo.js'));
      assert.fileContent(
        path.join(session.project.dir, 'lwc', 'foo', 'foo.js'),
        'export default class Foo extends LightningElement {}'
      );
    });

    it('should create custom template from local folder', () => {
      execCmd(`config:set ${OrgConfigProperties.ORG_CUSTOM_METADATA_TEMPLATES}=${LOCAL_CUSTOM_TEMPLATES}`);
      execCmd('force:apex:class:create --classname foo');
      assert.file(['foo.cls', 'foo.cls-meta.xml'].map((f) => path.join(session.project.dir, f)));
      assert.fileContent(path.join(session.project.dir, 'foo.cls'), 'public with sharing class foo');
    });

    it('should create from default template if local templates do not have the template type', () => {
      execCmd(`config:set ${OrgConfigProperties.ORG_CUSTOM_METADATA_TEMPLATES}=${LOCAL_CUSTOM_TEMPLATES}`);

      execCmd('force:lightning:component:create --componentname foo --outputdir lwc --type lwc');
      assert.file(path.join(session.project.dir, 'lwc', 'foo', 'foo.js-meta.xml'));
      assert.file(path.join(session.project.dir, 'lwc', 'foo', 'foo.html'));
      assert.file(path.join(session.project.dir, 'lwc', 'foo', 'foo.js'));
      assert.fileContent(
        path.join(session.project.dir, 'lwc', 'foo', 'foo.js'),
        'export default class Foo extends LightningElement {}'
      );
    });

    describe('stderr', () => {
      it('should throw error if local custom templates do not exist', () => {
        execCmd(`config:set ${OrgConfigProperties.ORG_CUSTOM_METADATA_TEMPLATES}=${NON_EXISTENT_LOCAL_PATH}`, {
          ensureExitCode: 0,
          cli: 'sf',
        });

        const stderr = execCmd('force:apex:class:create --classname foo').shellOutput.stderr;
        expect(stderr).to.contain(nls.localize('localCustomTemplateDoNotExist', NON_EXISTENT_LOCAL_PATH));
      });

      it('should throw error if cannot retrieve default branch', () => {
        execCmd(`config:set ${OrgConfigProperties.ORG_CUSTOM_METADATA_TEMPLATES}=${NON_EXISTENT_REPO}`, {
          ensureExitCode: 0,
          cli: 'sf',
        });

        const stderr = execCmd('force:apex:class:create --classname foo').shellOutput.stderr;
        expect(stderr).to.contain(nls.localize('customTemplatesCannotRetrieveDefaultBranch', NON_EXISTENT_REPO));
      });

      it('should throw error if repo url is invalid', () => {
        execCmd(`config:set ${OrgConfigProperties.ORG_CUSTOM_METADATA_TEMPLATES}=${INVALID_URL_REPO}`, {
          ensureExitCode: 0,
          cli: 'sf',
        });

        const stderr = execCmd('force:apex:class:create --classname foo').shellOutput.stderr;
        expect(stderr).to.contain(nls.localize('customTemplatesInvalidRepoUrl', INVALID_URL_REPO));
      });

      it('should throw error if repo protocol is not https', () => {
        execCmd(`config:set ${OrgConfigProperties.ORG_CUSTOM_METADATA_TEMPLATES}=${HTTP_REPO}`, {
          ensureExitCode: 0,
          cli: 'sf',
        });

        const stderr = execCmd('force:apex:class:create --classname foo').shellOutput.stderr;
        expect(stderr).to.contain(nls.localize('customTemplatesShouldUseHttpsProtocol', '"http:"'));
      });

      it('should throw error if not a GitHub repo', () => {
        execCmd(`config:set ${OrgConfigProperties.ORG_CUSTOM_METADATA_TEMPLATES}=${GITLAB_REPO}`, {
          ensureExitCode: 0,
          cli: 'sf',
        });

        const stderr = execCmd('force:apex:class:create --classname foo').shellOutput.stderr;
        expect(stderr).to.contain(nls.localize('customTemplatesSupportsGitHubOnly', GITLAB_REPO));
      });
    });
  });
});

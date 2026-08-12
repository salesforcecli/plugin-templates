/*
 * Copyright 2025, Salesforce, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import path from 'node:path';
import { expect, config } from 'chai';
import { TestSession, execCmd } from '@salesforce/cli-plugins-testkit';
import { nls } from '@salesforce/templates/lib/i18n/index.js';
import assert from 'yeoman-assert';

config.truncateThreshold = 0;

describe('template generate visualforce component:', () => {
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

  describe('Check visualforce component creation', () => {
    it('should create foo component using DefaultVFComponent template and default output directory', () => {
      execCmd('template generate visualforce component --componentname foo --label testlabel', {
        ensureExitCode: 0,
      });
      assert.file(['foo.component', 'foo.component-meta.xml'].map((f) => path.join(session.project.dir, f)));
      assert.fileContent(path.join(session.project.dir, 'foo.component'), 'This is your new Component');
      assert.fileContent(path.join(session.project.dir, 'foo.component-meta.xml'), '<label>testlabel</label>');
    });

    it('should create foo component in a folder with a custom name', () => {
      execCmd(
        'template generate visualforce component --componentname foo --outputdir testcomponent --label testlabel',
        {
          ensureExitCode: 0,
        }
      );
      assert.file(
        [path.join('testcomponent', 'foo.component'), path.join('testcomponent', 'foo.component-meta.xml')].map((f) =>
          path.join(session.project.dir, f)
        )
      );
    });

    it('should create foo component in custom folder name that has a space in it', () => {
      execCmd(
        'template generate visualforce component --componentname foo --outputdir "classes create" --label label',
        {
          ensureExitCode: 0,
        }
      );
      assert.file(
        [path.join('classes create', 'foo.component'), path.join('classes create', 'foo.component-meta.xml')].map((f) =>
          path.join(session.project.dir, f)
        )
      );
    });
  });

  describe('Check that all invalid name errors are thrown', () => {
    it('should throw a missing componentname error', () => {
      const stderr = execCmd('template generate visualforce component').shellOutput.stderr;
      expect(stderr).to.contain('Missing required flag');
    });

    it('should throw invalid non alphanumeric componentname error', () => {
      const stderr = execCmd('template generate visualforce component --componentname /a --label foo').shellOutput
        .stderr;
      expect(stderr).to.contain(nls.localize('AlphaNumericNameError'));
    });

    it('should throw invalid componentname starting with numeric error', () => {
      const stderr = execCmd('template generate visualforce component --componentname 3aa --label foo').shellOutput
        .stderr;
      expect(stderr).to.contain(nls.localize('NameMustStartWithLetterError'));
    });

    it('should throw invalid componentname ending with underscore error', () => {
      const stderr = execCmd('template generate visualforce component --componentname a_ --label foo').shellOutput
        .stderr;
      expect(stderr).to.contain(nls.localize('EndWithUnderscoreError'));
    });

    it('should throw invalid componentname with double underscore error', () => {
      const stderr = execCmd('template generate visualforce component --componentname a__a --label foo').shellOutput
        .stderr;
      expect(stderr).to.contain(nls.localize('DoubleUnderscoreError'));
    });
  });
});

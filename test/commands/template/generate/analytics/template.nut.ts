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
import fs from 'node:fs';
import { expect, config } from 'chai';
import { execCmd, TestSession } from '@salesforce/cli-plugins-testkit';
import { nls } from '@salesforce/templates/lib/i18n/index.js';
import assert from 'yeoman-assert';

config.truncateThreshold = 0;

describe('template generate analytics template:', () => {
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

  it('should create analytics template foo using foo as the output name and internal values', () => {
    execCmd('template generate analytics template --templatename foo --outputdir waveTemplates', { ensureExitCode: 0 });
    const rawFileContents = fs.readFileSync(
      path.join(session.project.dir, 'waveTemplates', 'foo', 'template-info.json'),
      'utf-8'
    );

    const parsedTemplate = JSON.parse(rawFileContents) as {
      label: string;
      // in real life, this should be (ex) 57.0, but JSON parse is going to read it as a number and turn it into 57
      assetVersion: number;
    };
    expect(parsedTemplate.label).to.equal('foo');
    expect(parsedTemplate.assetVersion).to.match(/^\d{2,}$/);
    // make sure it's really xx.0
    expect(rawFileContents).to.contain(`"assetVersion": ${parsedTemplate.assetVersion}.0`);

    assert.jsonFileContent(path.join(session.project.dir, 'waveTemplates', 'foo', 'folder.json'), { name: 'foo' });

    assert.jsonFileContent(path.join(session.project.dir, 'waveTemplates', 'foo', 'dashboards', 'fooDashboard.json'), {
      name: 'fooDashboard_tp',
      state: {
        widgets: {
          text_1: {
            parameters: {
              content: {
                richTextContent: [
                  {
                    attributes: {
                      size: '48px',
                      color: 'rgb(9, 26, 62)',
                    },
                    insert: 'foo Analytics Dashboard',
                  },
                  {
                    attributes: {
                      align: 'center',
                    },
                    insert: '\n',
                  },
                ],
              },
            },
          },
        },
      },
    });
  });
  describe('errors', () => {
    it('should throw error output directory does not contain waveTemplates', () => {
      const stderr = execCmd('template generate analytics template --templatename foo --outputdir foo').shellOutput
        .stderr;
      expect(stderr).to.contain(nls.localize('MissingWaveTemplatesDir'));
    });

    it('should throw error when missing required name field', () => {
      const stderr = execCmd('template generate analytics template').shellOutput.stderr;
      expect(stderr).to.contain('Missing required flag');
    });

    it('should throw error with message about invalid characters in name', () => {
      const stderr = execCmd('template generate analytics template --templatename foo$^s --outputdir waveTemplates')
        .shellOutput.stderr;
      expect(stderr).to.contain(nls.localize('AlphaNumericNameError'));
    });
  });
});

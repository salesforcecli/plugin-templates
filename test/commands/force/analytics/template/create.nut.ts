/*
 * Copyright (c) 2019, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import * as path from 'path';
import { expect, config } from 'chai';
import { execCmd, TestSession } from '@salesforce/cli-plugins-testkit';
import { nls } from '@salesforce/templates/lib/i18n';
import * as assert from 'yeoman-assert';

config.truncateThreshold = 0;

describe('Analytics template creation tests:', () => {
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
    execCmd('force:analytics:template:create --templatename foo --outputdir waveTemplates', { ensureExitCode: 0 });
    assert.jsonFileContent(path.join(session.project.dir, 'waveTemplates', 'foo', 'template-info.json'), {
      label: 'foo',
      assetVersion: 49.0,
    });

    assert.jsonFileContent(path.join(session.project.dir, 'waveTemplates', 'foo', 'folder.json'), { name: 'foo' });

    assert.jsonFileContent(path.join(session.project.dir, 'waveTemplates', 'foo', 'dashboards', 'fooDashboard.json'), {
      name: 'fooDashboard_tp',
      state: {
        widgets: {
          text_1: {
            parameters: {
              content: {
                displayTemplate: 'foo Analytics Dashboard',
              },
            },
          },
        },
      },
    });
  });
  describe('errors', () => {
    it('should throw error output directory does not contain waveTemplates', () => {
      const stderr = execCmd('force:analytics:template:create --templatename foo --outputdir foo').shellOutput.stderr;
      expect(stderr).to.contain(nls.localize('MissingWaveTemplatesDir'));
    });

    it('should throw error when missing required name field', () => {
      const stderr = execCmd('force:analytics:template:create').shellOutput.stderr;
      expect(stderr).to.contain('Missing required flag');
    });

    it('should throw error with message about invalid characters in name', () => {
      const stderr = execCmd('force:analytics:template:create --templatename foo$^s --outputdir waveTemplates')
        .shellOutput.stderr;
      expect(stderr).to.contain(nls.localize('AlphaNumericNameError'));
    });
  });
});

/*
 * Copyright (c) 2019, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import { TestContext } from '@salesforce/core/testSetup';
import { expect } from 'chai';
import { stubSfCommandUx } from '@salesforce/sf-plugins-core';
import { Messages } from '@salesforce/core';
import FlexipageGenerate from '../../../src/commands/flexipage/generate.js';

Messages.importMessagesDirectoryFromMetaUrl(import.meta.url);

describe('flexipage:generate', () => {
  const $$ = new TestContext();

  beforeEach(() => {
    stubSfCommandUx($$.SANDBOX);
  });

  afterEach(() => {
    $$.restore();
  });

  it('should require name flag', async () => {
    try {
      await FlexipageGenerate.run([]);
      expect.fail('Should have thrown an error');
    } catch (err) {
      const error = err as Error;
      expect(error.message).to.include('Missing required flag');
    }
  });

  it('should require template flag', async () => {
    try {
      await FlexipageGenerate.run(['--name', 'TestPage']);
      expect.fail('Should have thrown an error');
    } catch (err) {
      const error = err as Error;
      expect(error.message).to.include('Missing required flag');
    }
  });

  it('should require entity-name for RecordPage', async () => {
    try {
      await FlexipageGenerate.run(['--name', 'TestPage', '--template', 'RecordPage']);
      expect.fail('Should have thrown an error');
    } catch (err) {
      const error = err as Error;
      expect(error.message).to.include('entity-name');
    }
  });
});

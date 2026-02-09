/*
 * Copyright (c) 2019, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import { TestContext } from '@salesforce/core/testSetup';
import { expect } from 'chai';
import { stubSfCommandUx } from '@salesforce/sf-plugins-core';
import FlexipageGenerate from '../../../../src/commands/template/generate/flexipage.js';

describe('template:generate:flexipage', () => {
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

  it('should require sobject for RecordPage', async () => {
    try {
      await FlexipageGenerate.run(['--name', 'TestPage', '--template', 'RecordPage']);
      expect.fail('Should have thrown an error');
    } catch (err) {
      const error = err as Error;
      expect(error.message).to.include('sobject');
    }
  });

  it('should reject more than 11 secondary fields', async () => {
    try {
      await FlexipageGenerate.run([
        '--name',
        'TestPage',
        '--template',
        'RecordPage',
        '--sobject',
        'Account',
        '--secondary-fields',
        'F1,F2,F3,F4,F5,F6,F7,F8,F9,F10,F11,F12',
      ]);
      expect.fail('Should have thrown an error');
    } catch (err) {
      const error = err as Error;
      expect(error.message).to.include('Too many secondary fields');
    }
  });

  it('should be marked as beta', () => {
    expect(FlexipageGenerate.state).to.equal('beta');
  });

  it('should reject primary-field with non-RecordPage template', async () => {
    try {
      await FlexipageGenerate.run(['--name', 'TestPage', '--template', 'AppPage', '--primary-field', 'Name']);
      expect.fail('Should have thrown an error');
    } catch (err) {
      const error = err as Error;
      expect(error.message).to.include('primary-field');
      expect(error.message).to.include('RecordPage');
    }
  });

  it('should reject secondary-fields with non-RecordPage template', async () => {
    try {
      await FlexipageGenerate.run(['--name', 'TestPage', '--template', 'HomePage', '--secondary-fields', 'Industry']);
      expect.fail('Should have thrown an error');
    } catch (err) {
      const error = err as Error;
      expect(error.message).to.include('secondary-fields');
      expect(error.message).to.include('RecordPage');
    }
  });

  it('should reject detail-fields with non-RecordPage template', async () => {
    try {
      await FlexipageGenerate.run(['--name', 'TestPage', '--template', 'AppPage', '--detail-fields', 'Name,Phone']);
      expect.fail('Should have thrown an error');
    } catch (err) {
      const error = err as Error;
      expect(error.message).to.include('detail-fields');
      expect(error.message).to.include('RecordPage');
    }
  });
});

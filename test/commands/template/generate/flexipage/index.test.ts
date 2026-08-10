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

import { TestContext } from '@salesforce/core/testSetup';
import { expect } from 'chai';
import { stubSfCommandUx } from '@salesforce/sf-plugins-core';
import FlexipageGenerate from '../../../../../src/commands/template/generate/flexipage/index.js';

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

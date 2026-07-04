/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import { expect } from 'chai';
import UiBundleGenerate from '../../../../../src/commands/template/generate/ui-bundle/index.js';

describe('template:generate:ui-bundle', () => {
  it('should include vuebasic in --template flag options', () => {
    const templateFlag = UiBundleGenerate.flags.template;
    expect(templateFlag.options).to.include('vuebasic');
  });

  it('should include all expected --template flag options', () => {
    const templateFlag = UiBundleGenerate.flags.template;
    expect(templateFlag.options).to.deep.equal(['default', 'reactbasic', 'vuebasic']);
  });

  it('should default --template to default', () => {
    const templateFlag = UiBundleGenerate.flags.template;
    expect(templateFlag.default).to.equal('default');
  });

  it('should accept --template vuebasic without validation error', async () => {
    try {
      await UiBundleGenerate.run(['--name', 'TestBundle', '--template', 'vuebasic']);
    } catch (err) {
      const error = err as Error;
      expect(error.message).to.not.include('Expected --template=vuebasic to be one of');
    }
  });

  it('should reject invalid --template value', async () => {
    try {
      await UiBundleGenerate.run(['--name', 'TestBundle', '--template', 'invalidtemplate']);
      expect.fail('Should have thrown an error');
    } catch (err) {
      const error = err as Error;
      expect(error.message).to.include('Expected --template=invalidtemplate to be one of');
    }
  });

  it('should require name flag', async () => {
    try {
      await UiBundleGenerate.run([]);
      expect.fail('Should have thrown an error');
    } catch (err) {
      const error = err as Error;
      expect(error.message).to.include('Missing required flag');
    }
  });
});

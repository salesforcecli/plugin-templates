/*
 * Copyright (c) 2019, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import * as path from 'path';
import { ForceGeneratorAdapter, Log } from '@salesforce/templates/lib/utils';
import { expect } from 'chai';
import { stub } from 'sinon';
import { buildJson } from '../../src/utils/templateCommand';

describe('TemplateCommand', () => {
  describe('buildJson', () => {
    it('should build json output in the correct format', () => {
      const adapter = new ForceGeneratorAdapter();
      const targetDir = path.resolve('src', 'templates', 'output');
      const cleanOutput = ['testClass.cls', 'testClass.cls-meta.xml'];
      const rawOutput = 'create testClass.cls\n create testClass.cls-meta.xml\n';
      const cleanOutputStub = stub(Log.prototype, 'getCleanOutput').returns(cleanOutput);
      const outputStub = stub(Log.prototype, 'getOutput').returns(rawOutput);
      const targetDirOutput = `target dir = ${targetDir}\n${rawOutput}`;

      const expOutput = {
        outputDir: targetDir,
        created: cleanOutput,
        rawOutput: targetDirOutput,
      };

      const result = buildJson(adapter, targetDir);
      expect(result).to.eql(expOutput);
      cleanOutputStub.restore();
      outputStub.restore();
    });
  });
});

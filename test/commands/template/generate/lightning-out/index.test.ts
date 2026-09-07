/*
 * Copyright (c) 2026, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { Messages } from '@salesforce/core';
import { TestContext } from '@salesforce/core/testSetup';
import { expect } from 'chai';
import { stubSfCommandUx } from '@salesforce/sf-plugins-core';
import LightningOut, {
  mergeLightningOutInputs,
  readDefinition,
  isBelowApiFloor,
} from '../../../../../src/commands/template/generate/lightning-out/index.js';

// LightningOut's own module-level Messages.importMessagesDirectoryFromMetaUrl() registration
// (triggered by the import above) makes the 'lightningOut' bundle loadable here too.
const messages = Messages.loadMessages('@salesforce/plugin-templates', 'lightningOut');

describe('template generate lightning-out (unit)', () => {
  const $$ = new TestContext();
  beforeEach(() => {
    stubSfCommandUx($$.SANDBOX);
  });
  afterEach(() => {
    $$.restore();
  });

  it('is a beta, hidden command', () => {
    expect(LightningOut.state).to.equal('beta');
    expect(LightningOut.hidden).to.equal(true);
  });

  it('renders the actual output dir (not a literal placeholder) into the success.next-step deploy command', () => {
    const outputdir = 'force-app/main/default';
    const rendered = messages.getMessage('success.next-step', [outputdir, outputdir]);
    expect(rendered).to.include(`sf project deploy start -d ${outputdir} --api-version 68.0`);
    expect(rendered).to.not.include('<output-dir>');
  });

  describe('mergeLightningOutInputs', () => {
    it('takes appName/eca.name from flags over the definition file', () => {
      const { opts } = mergeLightningOutInputs(
        { appName: 'FromFile', eca: { name: 'EcaFile', contactEmail: 'f@f.com', callbackUrl: 'https://f.com/cb' } },
        { 'app-name': 'FromFlag', 'eca-name': 'EcaFlag' }
      );
      expect(opts.appName).to.equal('FromFlag');
      expect(opts.eca.name).to.equal('EcaFlag');
      expect(opts.eca.contactEmail).to.equal('f@f.com'); // unspecified flag falls back to file
    });
    it('replaces list keys wholesale when the flag layer provides them', () => {
      const { opts } = mergeLightningOutInputs(
        { hostDomains: ['https://a.com', 'https://b.com'], components: ['c/x'] },
        { 'host-domains': ['https://c.com'] }
      );
      expect(opts.hostDomains).to.deep.equal(['https://c.com']); // NOT concatenated with A,B
      expect(opts.components).to.deep.equal(['c/x']); // no flag -> file value kept
    });
    it('falls back entirely to the definition file when no flags given', () => {
      const { opts } = mergeLightningOutInputs(
        {
          appName: 'A',
          runtime: 'CLWR',
          hostDomains: ['https://a.com'],
          eca: { name: 'E', contactEmail: 'e@e.com', callbackUrl: 'https://a.com/cb' },
        },
        {}
      );
      expect(opts).to.deep.include({ appName: 'A', runtime: 'CLWR' });
      expect(opts.hostDomains).to.deep.equal(['https://a.com']);
    });
    it('reports unknown definition-file keys', () => {
      const { unknownKeys } = mergeLightningOutInputs({ appName: 'A', bogus: 1, other: 2 }, {});
      expect(unknownKeys).to.have.members(['bogus', 'other']);
    });
    it('defaults hostDomains to [] and leaves components undefined when absent everywhere', () => {
      const { opts } = mergeLightningOutInputs({}, {});
      expect(opts.hostDomains).to.deep.equal([]);
      expect(opts.components).to.equal(undefined);
    });
  });

  describe('readDefinition', () => {
    const tmpFiles: string[] = [];

    const writeTmpFile = (contents: string): string => {
      const file = path.join(os.tmpdir(), `lightning-out-readDefinition-${Date.now()}-${Math.random()}.json`);
      fs.writeFileSync(file, contents, 'utf8');
      tmpFiles.push(file);
      return file;
    };

    afterEach(() => {
      while (tmpFiles.length) {
        const file = tmpFiles.pop();
        if (file && fs.existsSync(file)) fs.rmSync(file);
      }
    });

    it('returns the parsed object for a valid JSON object file', () => {
      const file = writeTmpFile('{"appName":"A"}');
      expect(readDefinition(file)).to.deep.equal({ appName: 'A' });
    });

    it('throws a definition-file-json error for malformed JSON', () => {
      const file = writeTmpFile('{bad json');
      expect(() => readDefinition(file)).to.throw();
      try {
        readDefinition(file);
        expect.fail('expected readDefinition to throw');
      } catch (e) {
        expect((e as Error).name).to.equal('Definition-file-jsonError');
      }
    });

    it('throws a definition-file-not-object error for a JSON array', () => {
      const file = writeTmpFile('[]');
      expect(() => readDefinition(file)).to.throw();
      try {
        readDefinition(file);
        expect.fail('expected readDefinition to throw');
      } catch (e) {
        expect((e as Error).name).to.equal('Definition-file-not-objectError');
      }
    });
  });

  describe('isBelowApiFloor', () => {
    const cases: Array<[string | undefined, boolean]> = [
      ['64', true],
      ['67.0', true],
      ['68', false],
      ['68.0', false],
      ['70', false],
      [undefined, false],
      ['', false],
    ];

    cases.forEach(([input, expected]) => {
      it(`returns ${String(expected)} for ${JSON.stringify(input)}`, () => {
        expect(isBelowApiFloor(input)).to.equal(expected);
      });
    });

    it('treats non-numeric strings as not below the floor (current behavior)', () => {
      // current behavior: Number('garbage')=NaN, NaN<68 is false
      expect(isBelowApiFloor('garbage')).to.equal(false);
    });
  });
});

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

import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { Messages } from '@salesforce/core';
import { TestContext } from '@salesforce/core/testSetup';
import { expect } from 'chai';
import { stubSfCommandUx, stubUx } from '@salesforce/sf-plugins-core';
import { TemplateService } from '@salesforce/templates';
import LightningOut, {
  mergeLightningOutInputs,
  readDefinition,
  isBelowApiFloor,
  shellQuoteArg,
  validateDefinitionShape,
} from '../../../../../src/commands/template/generate/lightning-out/index.js';

// LightningOut's own module-level Messages.importMessagesDirectoryFromMetaUrl() registration
// (triggered by the import above) makes the 'lightningOut' bundle loadable here too.
const messages = Messages.loadMessages('@salesforce/plugin-templates', 'lightningOut');

describe('template generate lightning-out (unit)', () => {
  const $$ = new TestContext();
  let cmdStubs: ReturnType<typeof stubSfCommandUx>;
  beforeEach(() => {
    cmdStubs = stubSfCommandUx($$.SANDBOX);
  });
  afterEach(() => {
    $$.restore();
  });

  it('is a GA command (neither beta nor hidden)', () => {
    expect(LightningOut.state).to.equal(undefined);
    expect(LightningOut.hidden).to.not.equal(true);
  });

  it('renders the output dir into success.next-step and includes --api-version only when the suffix is supplied', () => {
    const outputdir = 'force-app/main/default';

    // Below-floor projects get the explicit 68.0 pin.
    const belowFloor = messages.getMessage('success.next-step', [outputdir, outputdir, ' --api-version 68.0']);
    expect(belowFloor).to.include(`sf project deploy start --source-dir ${outputdir} --api-version 68.0`);
    expect(belowFloor).to.not.include('<output-dir>');

    // At/above-floor projects omit the optional flag so the project's own default applies.
    const atOrAboveFloor = messages.getMessage('success.next-step', [outputdir, outputdir, '']);
    expect(atOrAboveFloor).to.include(`sf project deploy start --source-dir ${outputdir}`);
    expect(atOrAboveFloor).to.not.include('--api-version');
  });

  describe('post-run output', () => {
    const base = [
      '--app-name',
      'MyLoApp',
      '--eca-name',
      'MyLoAppEca',
      '--eca-contact-email',
      'dev@example.com',
      '--eca-callback-url',
      'https://example.com/cb',
      '--host-domains',
      'https://example.com',
    ];

    beforeEach(() => {
      stubUx($$.SANDBOX);
      $$.SANDBOX.stub(TemplateService.prototype, 'create').resolves({
        outputDir: '.',
        created: [],
        rawOutput: '',
      });
    });

    it('shows the site-link and frontdoor guidance for CLWR', async () => {
      await LightningOut.run([...base, '--runtime', 'CLWR']);
      const info = cmdStubs.info.args.flat();
      expect(info).to.include(messages.getMessage('success.clwr-site'));
      expect(info).to.include(messages.getMessage('success.frontdoor'));
      expect(messages.getMessage('success.clwr-site')).to.include('Linked Communities Site');
    });

    it('omits the CLWR guidance for LWR_CORE', async () => {
      await LightningOut.run([...base, '--runtime', 'LWR_CORE']);
      const info = cmdStubs.info.args.flat();
      expect(info).to.not.include(messages.getMessage('success.clwr-site'));
      expect(info).to.not.include(messages.getMessage('success.frontdoor'));
      expect(info).to.include(messages.getMessage('success.app-id'));
    });

    it('warns that the generated settings are org-wide for every runtime', async () => {
      for (const runtime of ['LWR_CORE', 'CLWR']) {
        cmdStubs.warn.resetHistory();
        // eslint-disable-next-line no-await-in-loop
        await LightningOut.run([...base, '--runtime', runtime]);
        const warned = cmdStubs.warn.args.flat();
        expect(warned).to.include(messages.getMessage('warning.org-settings'));
      }
      expect(messages.getMessage('warning.org-settings'))
        .to.include('isFirstPartyCookieUseRequired')
        .and.to.include('enableOauthCorsPolicy');
    });

    it('points to the App ID location and the app-id attribute', () => {
      expect(messages.getMessage('success.app-id'))
        .to.include('Lightning Out 2.0 App Manager')
        .and.to.include('"app-id"');
    });
  });

  it('keeps the runtime flag summary short and puts the detail in its description', () => {
    expect(LightningOut.flags.runtime.summary).to.not.include('Setup');
    expect(LightningOut.flags.runtime.description).to.include('link it to your site in Setup');
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

  describe('shellQuoteArg', () => {
    it('leaves a plain path untouched', () => {
      expect(shellQuoteArg('force-app/main/default')).to.equal('force-app/main/default');
    });
    it('single-quotes a path containing whitespace', () => {
      expect(shellQuoteArg('/tmp/Lightning Out')).to.equal("'/tmp/Lightning Out'");
    });
    it('escapes an embedded single quote', () => {
      expect(shellQuoteArg("/tmp/o'brien")).to.equal("'/tmp/o'\\''brien'");
    });
  });

  describe('validateDefinitionShape', () => {
    it('accepts a well-typed definition', () => {
      expect(() =>
        validateDefinitionShape(
          {
            appName: 'A',
            runtime: 'LWR_CORE',
            hostDomains: ['https://a.com'],
            components: ['c/x'],
            eca: { name: 'E', contactEmail: 'e@e.com', callbackUrl: 'https://a.com/cb' },
          },
          {}
        )
      ).to.not.throw();
    });
    it('is a no-op for an empty definition', () => {
      expect(() => validateDefinitionShape({}, {})).to.not.throw();
    });
    it('rejects a string field of the wrong type', () => {
      expect(() => validateDefinitionShape({ appName: 123 }, {})).to.throw(/appName/);
      expect(() => validateDefinitionShape({ runtime: 5 }, {})).to.throw(/runtime/);
    });
    it('rejects a list field that is not an array of strings', () => {
      expect(() => validateDefinitionShape({ hostDomains: 'https://a.com' }, {})).to.throw(/hostDomains/);
      expect(() => validateDefinitionShape({ components: [1, 2] }, {})).to.throw(/components/);
    });
    it('rejects eca when it is not an object', () => {
      expect(() => validateDefinitionShape({ eca: 'nope' }, {})).to.throw(/eca/);
      expect(() => validateDefinitionShape({ eca: [] }, {})).to.throw(/eca/);
    });
    it('rejects a wrong-typed nested eca field', () => {
      expect(() => validateDefinitionShape({ eca: { contactEmail: 123 } }, {})).to.throw(/eca\.contactEmail/);
    });
    it('skips a bad file value when the matching flag overrides it', () => {
      expect(() => validateDefinitionShape({ appName: 123 }, { 'app-name': 'Foo' })).to.not.throw();
      expect(() =>
        validateDefinitionShape({ hostDomains: 'bad' }, { 'host-domains': ['https://a.com'] })
      ).to.not.throw();
      expect(() =>
        validateDefinitionShape({ eca: { contactEmail: 123 } }, { 'eca-contact-email': 'x@y.com' })
      ).to.not.throw();
    });
  });
});

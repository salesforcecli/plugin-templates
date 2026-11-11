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
import { Messages, SfProject } from '@salesforce/core';
import { TestContext } from '@salesforce/core/testSetup';
import { expect } from 'chai';
import type * as sinon from 'sinon';
import { stubSfCommandUx, stubUx } from '@salesforce/sf-plugins-core';
import { TemplateService } from '@salesforce/templates';
import LightningOut, {
  isBelowSitesApi,
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

  it('is a GA, visible command', () => {
    expect(LightningOut.state).to.equal(undefined);
    expect(LightningOut.hidden).to.not.equal(true);
  });

  it('renders the output dir into success.next-step without --api-version', () => {
    const outputdir = 'force-app/main/default';
    const next = messages.getMessage('success.next-step', [outputdir, outputdir]);
    expect(next).to.include(`sf project deploy start --source-dir ${outputdir}`);
    expect(next).to.not.include('--api-version');
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
    const clwr = [...base, '--runtime', 'CLWR'];
    const guest = ['--app-name', 'MyLoApp', '--runtime', 'CLWR', '--access', 'guest', '--site', 'My Site'];

    let create: sinon.SinonStub;
    let resolveProject: sinon.SinonStub;
    /** Re-point the DX project lookup: undefined = no project, null = project without sourceApiVersion. */
    const stubProject = (sourceApiVersion?: unknown): void => {
      if (sourceApiVersion === undefined) {
        resolveProject.rejects(new Error('no project'));
      } else {
        resolveProject.resolves({
          getPath: () => '/proj',
          resolveProjectConfig: () => Promise.resolve(sourceApiVersion === null ? {} : { sourceApiVersion }),
        });
      }
    };
    const passedOpts = (): Record<string, unknown> => create.firstCall.args[1] as Record<string, unknown>;
    const runErr = async (args: string[]): Promise<Error | undefined> => {
      try {
        await LightningOut.run(args);
      } catch (e) {
        return e as Error;
      }
      return undefined;
    };
    const withDefFile = async (defn: unknown, fn: (file: string) => Promise<void>): Promise<void> => {
      const file = path.join(os.tmpdir(), `lo-def-${Date.now()}-${Math.random()}.json`);
      fs.writeFileSync(file, JSON.stringify(defn));
      try {
        await fn(file);
      } finally {
        fs.rmSync(file, { force: true });
      }
    };

    beforeEach(() => {
      stubUx($$.SANDBOX);
      // Never resolve the real project from the test's cwd.
      resolveProject = $$.SANDBOX.stub(SfProject, 'resolve');
      stubProject('69.0');
      create = $$.SANDBOX.stub(TemplateService.prototype, 'create').resolves({
        outputDir: '.',
        created: [],
        rawOutput: '',
      });
    });

    it('LWR_CORE: App ID line, shared guidance and org-settings warning, no CLWR site-link line', async () => {
      await LightningOut.run([...base, '--runtime', 'LWR_CORE']);
      const info = cmdStubs.info.args.flat();
      expect(info).to.include(messages.getMessage('success.app-id'));
      expect(info).to.include(messages.getMessage('success.dont-delete'));
      expect(info).to.include(messages.getMessage('success.eca-overwrite', ['MyLoAppEca']));
      expect(info).to.not.include(messages.getMessage('success.clwr-site'));
      expect(cmdStubs.warn.args.flat()).to.include(messages.getMessage('warning.org-settings'));
      const check = cmdStubs.info.getCalls().find((c) => c.args[0] === messages.getMessage('success.components-exist'));
      const deploy = cmdStubs.log.getCalls().find((c) => String(c.args[0]).includes('sf project deploy start'));
      expect(check!.calledBefore(deploy!)).to.equal(true);
    });

    it('LWR_CORE below 68.0 warns to raise sourceApiVersion and omits the failing deploy command', async () => {
      stubProject('66.0');
      await LightningOut.run([...base, '--runtime', 'LWR_CORE']);
      expect(cmdStubs.warn.args.flat()).to.include(messages.getMessage('warning.source-api-version', ['66.0']));
      const logged = cmdStubs.log.args.flat().map(String).join(' ');
      expect(logged).to.not.include('sf project deploy start');
      expect(logged).to.not.include('--api-version');
    });

    describe('CLWR site-required rule', () => {
      const required = (reasonKey: string, tokens: string[] = []): string =>
        messages.getMessage('error.clwr-site-required', [messages.getMessage(reasonKey, tokens)]);
      const atVersion = (api: string): string => required('error.clwr-site-required.version', [api]);

      it('errors without generating at 69.0+, with no project, no version, or an unparsable version', async () => {
        const cases: Array<[unknown, string]> = [
          ['69.0', atVersion('69.0')],
          ['70.0', atVersion('70.0')],
          ['69', atVersion('69')],
          [70, atVersion('70')],
          ['latest', required('error.clwr-site-required.invalid-version', ['latest'])],
          [undefined, required('error.clwr-site-required.no-project')],
          [null, required('error.clwr-site-required.no-version')],
        ];
        for (const [api, message] of cases) {
          stubProject(api);
          // eslint-disable-next-line no-await-in-loop
          const err = await runErr(clwr);
          expect(err?.message, String(api)).to.equal(message);
        }
        expect(create.called).to.equal(false);
      });

      it('applies to guest and to a runtime coming from the definition file', async () => {
        const err = await runErr(guest.slice(0, -2));
        expect(err?.message).to.equal(atVersion('69.0'));
        await withDefFile({ appName: 'A', runtime: 'CLWR' }, async (file) => {
          const fileErr = await runErr([...base, '--definition-file', file]);
          expect(fileErr?.message).to.equal(atVersion('69.0'));
        });
        expect(create.called).to.equal(false);
      });

      it('is skipped for LWR_CORE and when the runtime is missing', async () => {
        stubProject(undefined);
        await LightningOut.run([...base, '--runtime', 'LWR_CORE']);
        stubProject('69.0');
        await LightningOut.run(base);
        expect(create.calledTwice).to.equal(true);
      });

      it('allows a site-less run below 69.0 (including a numeric version) and prints the Setup link line', async () => {
        for (const api of ['66.0', '68.0', '68.9', 66]) {
          stubProject(api);
          cmdStubs.info.resetHistory();
          cmdStubs.warn.resetHistory();
          // eslint-disable-next-line no-await-in-loop
          await LightningOut.run(clwr);
          const info = cmdStubs.info.args.flat();
          expect(info, String(api)).to.include(messages.getMessage('success.clwr-site'));
          expect(info).to.not.include(messages.getMessage('success.app-id'));
          // The redeploy-after-bump caveat is a warning, so --json still carries it.
          expect(cmdStubs.warn.args.flat(), String(api)).to.include(messages.getMessage('warning.clwr-site-later'));
        }
        expect(create.callCount).to.equal(4);
      });

      it('adds the make-the-page-public step for a site-less guest app below 69.0', async () => {
        stubProject('66.0');
        await LightningOut.run(guest.slice(0, -2));
        const info = cmdStubs.info.args.flat();
        expect(info).to.include(messages.getMessage('success.clwr-site'));
        expect(info).to.include(messages.getMessage('success.clwr-site-guest'));
        cmdStubs.info.resetHistory();
        await LightningOut.run(clwr);
        expect(cmdStubs.info.args.flat()).to.not.include(messages.getMessage('success.clwr-site-guest'));
      });

      it('reads the project from the output dir, not the cwd', async () => {
        await LightningOut.run([...guest, '--output-dir', '/tmp/other-proj/force-app']);
        expect(resolveProject.lastCall.args[0]).to.equal(path.resolve('/tmp/other-proj/force-app'));
      });
    });

    describe('site guidance', () => {
      const deployCmd = (): string | undefined =>
        cmdStubs.log.args
          .flat()
          .map(String)
          .find((m) => m.includes('sf project deploy start'));

      it('guest: org-url guidance, no ECA notes and no org-settings warning', async () => {
        await LightningOut.run(guest);
        const info = cmdStubs.info.args.flat();
        const linked = messages.getMessage('success.clwr-site-linked-guest', ['My Site']);
        expect(info).to.include(linked);
        expect(linked).to.include('org-url').and.to.include('site-prefix');
        expect(info).to.not.include(messages.getMessage('success.clwr-site-linked-authenticated', ['My Site']));
        expect(info).to.not.include(messages.getMessage('success.clwr-site'));
        expect(info).to.not.include(messages.getMessage('success.dont-delete'));
        expect(cmdStubs.warn.args.flat()).to.not.include(messages.getMessage('warning.org-settings'));
        expect(deployCmd()).to.not.include('--api-version');
        expect(cmdStubs.warn.args.flat().map(String).join(' ')).to.not.include(
          "To deploy an app that's linked to a site"
        );
      });

      it('authenticated: frontdoor-url guidance, ECA notes and org-settings warning', async () => {
        await LightningOut.run([...clwr, '--site', ' My Site ']);
        const info = cmdStubs.info.args.flat();
        const linked = messages.getMessage('success.clwr-site-linked-authenticated', ['My Site']);
        expect(info).to.include(linked);
        expect(linked).to.include('frontdoor-url');
        expect(info).to.not.include(messages.getMessage('success.clwr-site-linked-guest', ['My Site']));
        expect(info).to.include(messages.getMessage('success.dont-delete'));
        expect(cmdStubs.warn.args.flat()).to.include(messages.getMessage('warning.org-settings'));
      });

      it('warns once and omits the failing deploy command and the site-linked steps below 69.0', async () => {
        for (const api of ['66.0', '68.0']) {
          stubProject(api);
          cmdStubs.warn.resetHistory();
          cmdStubs.info.resetHistory();
          // eslint-disable-next-line no-await-in-loop
          await LightningOut.run(guest);
          const warned = cmdStubs.warn.args.flat();
          expect(warned, api).to.include(messages.getMessage('warning.site-api-version', [api]));
          expect(
            warned.map(String).filter((m) => m.includes("To deploy an app that's linked to a site"))
          ).to.have.length(1);
          const info = cmdStubs.info.args.flat();
          expect(info).to.not.include(messages.getMessage('success.clwr-site-linked-guest', ['My Site']));
          expect(deployCmd(), api).to.equal(undefined);
          expect(warned).to.not.include(messages.getMessage('warning.clwr-site-later'));
        }
        stubProject('66.0');
        cmdStubs.info.resetHistory();
        await LightningOut.run([...clwr, '--site', 'My Site']);
        const info = cmdStubs.info.args.flat();
        expect(info).to.not.include(messages.getMessage('success.clwr-site-linked-authenticated', ['My Site']));
        // The ECA notes still print; only the site-linked steps are skipped.
        expect(info).to.include(messages.getMessage('success.dont-delete'));
      });

      it('does not claim failure when the version is unknown, and keeps the setup guidance', async () => {
        for (const api of ['latest', null, undefined]) {
          stubProject(api);
          cmdStubs.warn.resetHistory();
          cmdStubs.info.resetHistory();
          // eslint-disable-next-line no-await-in-loop
          await LightningOut.run(guest);
          expect(
            cmdStubs.warn.args
              .flat()
              .map(String)
              .some((m) => m.includes("To deploy an app that's linked to a site")),
            String(api)
          ).to.equal(false);
          expect(cmdStubs.info.args.flat()).to.include(
            messages.getMessage('success.clwr-site-linked-guest', ['My Site'])
          );
        }
      });
    });

    describe('definition file and flags', () => {
      it('takes site/access/runtime from the file and lets each flag override it', async () => {
        await withDefFile({ appName: 'A', runtime: 'CLWR', access: 'guest', site: 'FileSite' }, async (file) => {
          await LightningOut.run(['--definition-file', file]);
          expect(passedOpts()).to.deep.include({ runtime: 'CLWR', access: 'guest', site: 'FileSite' });
          create.resetHistory();
          await LightningOut.run(['--definition-file', file, '--access', 'authenticated', '--site', 'FlagSite']);
          expect(passedOpts()).to.deep.include({ runtime: 'CLWR', access: 'authenticated', site: 'FlagSite' });
          create.resetHistory();
          await LightningOut.run(['--definition-file', file, '--runtime', 'LWR_CORE']);
          expect(passedOpts()).to.deep.include({ runtime: 'LWR_CORE' });
        });
      });

      it('treats null site/access as absent: site-less run is allowed below 69.0 and required at 69.0', async () => {
        await withDefFile({ runtime: 'CLWR', site: null, access: null }, async (file) => {
          stubProject('68.0');
          await LightningOut.run([...base, '--definition-file', file]);
          expect(passedOpts().site).to.equal(undefined);
          expect(passedOpts().access).to.equal(undefined);
          stubProject('69.0');
          const err = await runErr([...base, '--definition-file', file]);
          expect(err?.message).to.include(messages.getMessage('error.clwr-site-required.version', ['69.0']));
        });
      });

      it('warns about an unrecognized top-level key', async () => {
        await withDefFile({ Site: 'x' }, async (file) => {
          await LightningOut.run([...guest, '--definition-file', file]);
        });
        expect(cmdStubs.warn.args.flat()).to.include(messages.getMessage('warning.unknown-definition-key', ['Site']));
      });
    });
  });

  describe('mergeLightningOutInputs', () => {
    it('lets flags win per key, replaces lists wholesale, and falls back to the file', () => {
      const { opts } = mergeLightningOutInputs(
        {
          appName: 'FromFile',
          hostDomains: ['https://a.com', 'https://b.com'],
          components: ['c/x'],
          eca: { name: 'EcaFile', contactEmail: 'f@f.com', callbackUrl: 'https://f.com/cb' },
        },
        { 'app-name': 'FromFlag', 'eca-name': 'EcaFlag', 'host-domains': ['https://c.com'] }
      );
      expect(opts.appName).to.equal('FromFlag');
      expect(opts.eca?.name).to.equal('EcaFlag');
      expect(opts.eca?.contactEmail).to.equal('f@f.com');
      expect(opts.hostDomains).to.deep.equal(['https://c.com']);
      expect(opts.components).to.deep.equal(['c/x']);
    });
    it('defaults hostDomains to [] and reports unknown keys', () => {
      const { opts, unknownKeys } = mergeLightningOutInputs({ bogus: 1, site: 'S', access: 'guest' }, {});
      expect(opts.hostDomains).to.deep.equal([]);
      expect(opts).to.deep.include({ site: 'S', access: 'guest' });
      expect(unknownKeys).to.deep.equal(['bogus']);
    });
    it('treats JSON null site/access as absent', () => {
      const { opts } = mergeLightningOutInputs({ site: null, access: null }, {});
      expect(opts).to.deep.include({ site: undefined, access: undefined });
    });
  });

  describe('helpers', () => {
    it('isBelowSitesApi fails safe for unknown or unparsable versions', () => {
      expect(isBelowSitesApi('68.0')).to.equal(true);
      expect(isBelowSitesApi(' 68.0 ')).to.equal(true);
      for (const v of ['69.0', '70', undefined, 'latest', '0x40', '1e1']) expect(isBelowSitesApi(v)).to.equal(false);
    });
    it('isBelowApiFloor treats unknown or unparsable versions as not below', () => {
      expect(isBelowApiFloor('64')).to.equal(true);
      expect(isBelowApiFloor('67.0')).to.equal(true);
      for (const v of ['68', '68.0', '70', undefined, '', 'garbage', '0x40', '1e1', '64.0.1']) {
        expect(isBelowApiFloor(v), String(v)).to.equal(false);
      }
    });
    it('shellQuoteArg quotes only when needed', () => {
      expect(shellQuoteArg('force-app/main/default')).to.equal('force-app/main/default');
      expect(shellQuoteArg('/tmp/Lightning Out')).to.equal("'/tmp/Lightning Out'");
      expect(shellQuoteArg("/tmp/o'brien")).to.equal("'/tmp/o'\\''brien'");
    });
  });

  describe('readDefinition', () => {
    let dir: string;
    const write = (contents: string): string => {
      const file = path.join(dir, `def-${Math.random()}.json`);
      fs.writeFileSync(file, contents, 'utf8');
      return file;
    };
    const errName = (file: string): string | undefined => {
      try {
        readDefinition(file);
      } catch (e) {
        return (e as Error).name;
      }
      return undefined;
    };
    before(() => {
      dir = fs.mkdtempSync(path.join(os.tmpdir(), 'lo-readdef-'));
    });
    after(() => {
      fs.rmSync(dir, { recursive: true, force: true });
    });

    it('returns a JSON object and rejects malformed JSON and non-objects', () => {
      expect(readDefinition(write('{"appName":"A"}'))).to.deep.equal({ appName: 'A' });
      expect(errName(write('{bad json'))).to.equal('Definition-file-jsonError');
      expect(errName(write('[]'))).to.equal('Definition-file-not-objectError');
    });
  });

  describe('validateDefinitionShape', () => {
    it('accepts a well-typed (or empty) definition', () => {
      expect(() => validateDefinitionShape({}, {})).to.not.throw();
      expect(() =>
        validateDefinitionShape(
          {
            appName: 'A',
            runtime: 'LWR_CORE',
            site: 'S',
            access: 'guest',
            hostDomains: ['https://a.com'],
            components: ['c/x'],
            eca: { name: 'E', contactEmail: 'e@e.com', callbackUrl: 'https://a.com/cb' },
          },
          {}
        )
      ).to.not.throw();
    });
    it('rejects wrong-typed fields', () => {
      expect(() => validateDefinitionShape({ appName: 123 }, {})).to.throw(/appName/);
      expect(() => validateDefinitionShape({ site: ['a'] }, {})).to.throw(/site/);
      expect(() => validateDefinitionShape({ access: true }, {})).to.throw(/access/);
      expect(() => validateDefinitionShape({ hostDomains: 'https://a.com' }, {})).to.throw(/hostDomains/);
      expect(() => validateDefinitionShape({ components: [1, 2] }, {})).to.throw(/components/);
      expect(() => validateDefinitionShape({ eca: [] }, {})).to.throw(/eca/);
      expect(() => validateDefinitionShape({ eca: { contactEmail: 123 } }, {})).to.throw(/eca\.contactEmail/);
    });
    it('accepts JSON null for site and access', () => {
      expect(() => validateDefinitionShape({ site: null, access: null }, {})).to.not.throw();
    });
    it('rejects wrong-typed runtime and eca, and ignores a bad hostDomains when the flag overrides it', () => {
      expect(() => validateDefinitionShape({ runtime: 5 }, {})).to.throw(/runtime/);
      expect(() => validateDefinitionShape({ eca: 'nope' }, {})).to.throw(/eca/);
      expect(() =>
        validateDefinitionShape({ hostDomains: 'bad' }, { 'host-domains': ['https://a.com'] })
      ).to.not.throw();
    });
    it('skips a bad file value when the matching flag overrides it', () => {
      expect(() => validateDefinitionShape({ appName: 123 }, { 'app-name': 'Foo' })).to.not.throw();
      expect(() => validateDefinitionShape({ site: 1 }, { site: 'ok' })).to.not.throw();
      expect(() =>
        validateDefinitionShape({ eca: { contactEmail: 123 } }, { 'eca-contact-email': 'x@y.com' })
      ).to.not.throw();
    });
  });
});

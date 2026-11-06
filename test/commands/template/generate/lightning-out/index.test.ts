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
  findAuthOnlyFiles,
  ignoredGuestEcaInputs,
  isBelowSitesApi,
  mergeLightningOutInputs,
  readDefinition,
  isBelowApiFloor,
  shellQuoteArg,
  suggestKey,
  unknownKeyWarning,
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

  it('renders the output dir into success.next-step and never suggests --api-version', () => {
    const outputdir = 'force-app/main/default';
    const msg = messages.getMessage('success.next-step', [outputdir, outputdir]);
    expect(msg).to.include(`sf project deploy start --source-dir ${outputdir}`);
    expect(msg).to.not.include('--api-version');
    expect(msg).to.not.include('<output-dir>');
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

    let create: sinon.SinonStub;
    let resolveProject: sinon.SinonStub;
    /** Re-point the DX project lookup; undefined = no project found. Defaults to 69.0 (beforeEach). */
    const stubProject = (sourceApiVersion?: string): void => {
      if (sourceApiVersion === undefined) {
        resolveProject.rejects(new Error('no project'));
      } else {
        resolveProject.resolves({
          getPath: () => '/proj',
          resolveProjectConfig: () => Promise.resolve({ sourceApiVersion }),
        });
      }
    };
    const runtimeArgs = (runtime: string): string[] =>
      runtime === 'CLWR' ? ['--runtime', 'CLWR', '--site', 'My Site'] : ['--runtime', runtime];

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

    it('shows the Setup site-link guidance, and not the App ID line, for CLWR without a site below 69.0', async () => {
      stubProject('68.0');
      await LightningOut.run([...base, '--runtime', 'CLWR']);
      const info = cmdStubs.info.args.flat();
      expect(info).to.include(messages.getMessage('success.clwr-site'));
      expect(info).to.not.include(messages.getMessage('success.app-id'));
      expect(messages.getMessage('success.clwr-site')).to.include('Linked Communities Site');
    });

    it('shows the App ID line, and not the CLWR site-link guidance, for LWR_CORE', async () => {
      await LightningOut.run([...base, '--runtime', 'LWR_CORE']);
      const info = cmdStubs.info.args.flat();
      expect(info).to.include(messages.getMessage('success.app-id'));
      expect(info).to.not.include(messages.getMessage('success.clwr-site'));
    });

    it('shows the shared guidance for every runtime', async () => {
      for (const runtime of ['LWR_CORE', 'CLWR']) {
        cmdStubs.info.resetHistory();
        // eslint-disable-next-line no-await-in-loop
        await LightningOut.run([...base, ...runtimeArgs(runtime)]);
        const info = cmdStubs.info.args.flat();
        expect(info).to.include(messages.getMessage('success.dont-delete'));
        expect(info).to.include(messages.getMessage('success.eca-overwrite', ['MyLoAppEca']));
        expect(info).to.include(messages.getMessage('success.components-exist'));
      }
    });

    it('prints the pre-deploy component check before the deploy command', async () => {
      await LightningOut.run([...base, '--runtime', 'LWR_CORE']);
      const check = cmdStubs.info.getCalls().find((c) => c.args[0] === messages.getMessage('success.components-exist'));
      const deploy = cmdStubs.log.getCalls().find((c) => String(c.args[0]).includes('sf project deploy start'));
      expect(check, 'components-exist was not printed').to.not.equal(undefined);
      expect(deploy, 'next-step was not printed').to.not.equal(undefined);
      expect(check!.calledBefore(deploy!)).to.equal(true);
    });

    it('warns that the generated settings are org-wide for every runtime', async () => {
      for (const runtime of ['LWR_CORE', 'CLWR']) {
        cmdStubs.warn.resetHistory();
        // eslint-disable-next-line no-await-in-loop
        await LightningOut.run([...base, ...runtimeArgs(runtime)]);
        const warned = cmdStubs.warn.args.flat();
        expect(warned).to.include(messages.getMessage('warning.org-settings'));
      }
      expect(messages.getMessage('warning.org-settings'))
        .to.include('isFirstPartyCookieUseRequired')
        .and.to.include('enableOauthCorsPolicy');
    });

    describe('CLWR site and access', () => {
      const guest = ['--app-name', 'MyLoApp', '--runtime', 'CLWR', '--access', 'guest', '--site', 'My Site'];
      const passedOpts = (): Record<string, unknown> => create.firstCall.args[1] as Record<string, unknown>;

      for (const [label, api] of [
        ['sourceApiVersion 69.0', '69.0'],
        ['sourceApiVersion 70.0', '70.0'],
        ['no DX project', undefined],
      ] as Array<[string, string | undefined]>) {
        it(`errors, without generating, for CLWR without a site (${label})`, async () => {
          stubProject(api);
          let err: Error | undefined;
          try {
            await LightningOut.run([...base, '--runtime', 'CLWR']);
          } catch (e) {
            err = e as Error;
          }
          expect(err?.name).to.equal(api ? 'Clwr-site-requiredError' : 'Clwr-site-required-no-projectError');
          expect(create.called).to.equal(false);
        });
      }

      for (const api of ['66.0', '68.0']) {
        it(`allows CLWR without a site at sourceApiVersion ${api}`, async () => {
          stubProject(api);
          await LightningOut.run([...base, '--runtime', 'CLWR']);
          expect(create.calledOnce).to.equal(true);
          expect(cmdStubs.info.args.flat()).to.include(messages.getMessage('success.clwr-site'));
        });
      }

      it('takes site/access from the definition file and lets flags override them', async () => {
        stubProject('69.0');
        const file = path.join(os.tmpdir(), `lo-def-${Date.now()}-${Math.random()}.json`);
        fs.writeFileSync(file, JSON.stringify({ appName: 'A', runtime: 'CLWR', access: 'guest', site: 'FileSite' }));
        try {
          await LightningOut.run(['--definition-file', file]);
          expect(passedOpts()).to.deep.include({ site: 'FileSite', access: 'guest' });
          create.resetHistory();
          await LightningOut.run(['--definition-file', file, '--site', 'FlagSite']);
          expect(passedOpts()).to.deep.include({ site: 'FlagSite', access: 'guest' });
        } finally {
          fs.rmSync(file, { force: true });
        }
      });

      it('passes --access with LWR_CORE to the generator, which rejects it', async () => {
        stubProject('69.0');
        create.restore();
        let err: Error | undefined;
        try {
          await LightningOut.run([...base, '--runtime', 'LWR_CORE', '--access', 'authenticated']);
        } catch (e) {
          err = e as Error;
        }
        expect(err?.message).to.match(/access applies only to runtime CLWR/);
      });

      it('rejects a site/access key with LWR_CORE coming from the definition file', async () => {
        stubProject('69.0');
        create.restore();
        const file = path.join(os.tmpdir(), `lo-def-${Date.now()}-${Math.random()}.json`);
        fs.writeFileSync(file, JSON.stringify({ site: 'S', access: 'guest' }));
        let err: Error | undefined;
        try {
          await LightningOut.run([...base, '--runtime', 'LWR_CORE', '--definition-file', file]);
        } catch (e) {
          err = e as Error;
        } finally {
          fs.rmSync(file, { force: true });
        }
        expect(err?.message).to.match(/site applies only to runtime CLWR/);
        expect(err?.message).to.match(/access applies only to runtime CLWR/);
      });

      it('guest: no org-settings warning and no ECA notes; prints the site and guest guidance', async () => {
        stubProject('69.0');
        await LightningOut.run(guest);
        const warned = cmdStubs.warn.args.flat();
        const info = cmdStubs.info.args.flat();
        expect(warned).to.not.include(messages.getMessage('warning.org-settings'));
        expect(info).to.not.include(messages.getMessage('success.dont-delete'));
        expect(info.map(String).some((m) => m.includes('External Client Application "'))).to.equal(false);
        expect(info).to.include(messages.getMessage('success.clwr-site-linked', ['My Site']));
        expect(info).to.include(messages.getMessage('success.clwr-guest-public'));
        expect(info).to.include(messages.getMessage('success.site-relink'));
        expect(info).to.not.include(messages.getMessage('success.access-default'));
        expect(info).to.not.include(messages.getMessage('success.app-id'));
      });

      it('guest: warns about ignored eca inputs', async () => {
        stubProject('69.0');
        await LightningOut.run([...guest, '--eca-name', 'E', '--eca-contact-email', 'e@e.com']);
        expect(cmdStubs.warn.args.flat()).to.include(
          messages.getMessage('warning.guest-eca-ignored', ['--eca-name, --eca-contact-email'])
        );
      });

      it('authenticated with a site: access-default info, site guidance, ECA notes, no guest line', async () => {
        stubProject('69.0');
        await LightningOut.run([...base, '--runtime', 'CLWR', '--site', ' My Site ']);
        const info = cmdStubs.info.args.flat();
        expect(info).to.include(messages.getMessage('success.access-default'));
        expect(info).to.include(messages.getMessage('success.clwr-site-linked', ['My Site']));
        expect(info).to.not.include(messages.getMessage('success.clwr-guest-public'));
        expect(info).to.include(messages.getMessage('success.dont-delete'));
        expect(cmdStubs.warn.args.flat()).to.include(messages.getMessage('warning.org-settings'));
      });

      it('explicit --access authenticated suppresses the access-default info', async () => {
        stubProject('69.0');
        await LightningOut.run([...base, '--runtime', 'CLWR', '--site', 'S', '--access', 'authenticated']);
        expect(cmdStubs.info.args.flat()).to.not.include(messages.getMessage('success.access-default'));
      });

      for (const [api, expected] of [
        ['66.0', 'site-api-version'],
        ['68.0', 'site-api-version'],
        ['69.0', undefined],
        [undefined, 'site-no-project'],
      ] as Array<[string | undefined, string | undefined]>) {
        it(`--site at sourceApiVersion ${String(api)}: ${expected ?? 'no'} version warning`, async () => {
          stubProject(api);
          await LightningOut.run(guest);
          const warned = cmdStubs.warn.args.flat().map(String);
          const siteApi = api ? messages.getMessage('warning.site-api-version', [api]) : undefined;
          const noProject = messages.getMessage('warning.site-no-project');
          expect(siteApi !== undefined && warned.includes(siteApi)).to.equal(expected === 'site-api-version');
          expect(warned.includes(noProject)).to.equal(expected === 'site-no-project');
        });
      }

      it('guest: warns about authenticated-only files already in the output dir', async () => {
        stubProject('69.0');
        const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'lo-guest-'));
        try {
          fs.mkdirSync(path.join(dir, 'externalClientApps'));
          fs.writeFileSync(path.join(dir, 'externalClientApps', 'Old.eca-meta.xml'), '');
          await LightningOut.run([...guest, '--output-dir', dir]);
          expect(cmdStubs.warn.args.flat()).to.include(
            messages.getMessage('warning.guest-stale-files', [dir, path.join('externalClientApps', 'Old.eca-meta.xml')])
          );
        } finally {
          fs.rmSync(dir, { recursive: true, force: true });
        }
      });

      it('guest: no stale-files warning for an empty output dir; authenticated never warns', async () => {
        const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'lo-guest-'));
        const stale = (m: unknown): boolean => String(m).includes("Guest access doesn't need them");
        try {
          await LightningOut.run([...guest, '--output-dir', dir]);
          expect(cmdStubs.warn.args.flat().some(stale)).to.equal(false);
          fs.mkdirSync(path.join(dir, 'externalClientApps'));
          fs.writeFileSync(path.join(dir, 'externalClientApps', 'Old.eca-meta.xml'), '');
          await LightningOut.run([...base, '--runtime', 'CLWR', '--site', 'S', '--output-dir', dir]);
          expect(cmdStubs.warn.args.flat().some(stale)).to.equal(false);
        } finally {
          fs.rmSync(dir, { recursive: true, force: true });
        }
      });

      it('guest: warns about ignored eca inputs coming from the definition file', async () => {
        const file = path.join(os.tmpdir(), `lo-def-${Date.now()}-${Math.random()}.json`);
        fs.writeFileSync(file, JSON.stringify({ eca: { name: 'E', callbackUrl: 'https://x.example.com/cb' } }));
        try {
          await LightningOut.run([...guest, '--definition-file', file]);
        } finally {
          fs.rmSync(file, { force: true });
        }
        expect(cmdStubs.warn.args.flat()).to.include(
          messages.getMessage('warning.guest-eca-ignored', ['eca.name, eca.callbackUrl'])
        );
      });

      it('guest without a site below 69.0: Setup link guidance plus the public-page line, no ECA notes', async () => {
        stubProject('66.0');
        await LightningOut.run(['--app-name', 'MyLoApp', '--runtime', 'CLWR', '--access', 'guest']);
        const info = cmdStubs.info.args.flat();
        expect(info).to.include(messages.getMessage('success.clwr-site'));
        expect(info).to.include(messages.getMessage('success.clwr-guest-public'));
        expect(info).to.not.include(messages.getMessage('success.dont-delete'));
        expect(cmdStubs.warn.args.flat()).to.not.include(messages.getMessage('warning.org-settings'));
      });

      it('--site at 68.0 prints no --api-version (it would not change the manifest version)', async () => {
        stubProject('68.0');
        await LightningOut.run(guest);
        const deploy = cmdStubs.log.args
          .flat()
          .map(String)
          .find((m) => m.includes('sf project deploy start'));
        expect(deploy).to.not.include('--api-version');
      });

      it('--site with no project prints no --api-version', async () => {
        stubProject(undefined);
        await LightningOut.run(guest);
        const deploy = cmdStubs.log.args
          .flat()
          .map(String)
          .find((m) => m.includes('sf project deploy start'));
        expect(deploy).to.not.include('--api-version');
      });

      it('LWR_CORE below 68.0 prints no --api-version and warns to raise sourceApiVersion', async () => {
        stubProject('66.0');
        await LightningOut.run([...base, '--runtime', 'LWR_CORE']);
        const deploy = cmdStubs.log.args
          .flat()
          .map(String)
          .find((m) => m.includes('sf project deploy start'));
        expect(deploy).to.not.include('--api-version');
        expect(cmdStubs.warn.args.flat()).to.include(messages.getMessage('warning.source-api-version', ['66.0']));
      });

      it('resolves the DX project from --output-dir, not the current directory', async () => {
        await LightningOut.run([...base, '--runtime', 'LWR_CORE', '--output-dir', 'some/out']);
        expect(resolveProject.firstCall.args[0]).to.equal(path.resolve('some/out'));
      });

      it('a numeric sourceApiVersion (68, not "68.0") is handled, not a crash', async () => {
        stubProject(68 as unknown as string);
        await LightningOut.run([...base, '--runtime', 'CLWR']);
        expect(create.calledOnce).to.equal(true);
        expect(cmdStubs.info.args.flat()).to.include(messages.getMessage('success.clwr-site'));
      });

      /** cwd resolves to project "cwd" (cwdApi), --output-dir other/proj to project "out" (outApi). */
      const stubTwoProjects = (outApi: string | undefined, cwdApi: string | undefined): void => {
        resolveProject.callsFake((p: string) => {
          const isOut = p === path.resolve('other/proj');
          return Promise.resolve({
            getPath: () => (isOut ? '/out' : '/cwd'),
            resolveProjectConfig: () => Promise.resolve({ sourceApiVersion: isOut ? outApi : cwdApi }),
          });
        });
      };
      const runCwdErr = async (args: string[]): Promise<Error | undefined> => {
        try {
          await LightningOut.run(args);
        } catch (e) {
          return e as Error;
        }
        return undefined;
      };

      it('CLWR without a site needs a site when the cwd project is at 69.0+, even if --output-dir is below', async () => {
        stubTwoProjects('68.0', '70.0');
        const err = await runCwdErr([...base, '--runtime', 'CLWR', '--output-dir', 'other/proj']);
        expect(err?.message).to.equal(messages.getMessage('error.clwr-site-required-cwd', ['70.0']));
        expect(create.called).to.equal(false);
      });

      it('CLWR without a site needs a site when the cwd project sets no sourceApiVersion', async () => {
        stubTwoProjects('68.0', undefined);
        const err = await runCwdErr([...base, '--runtime', 'CLWR', '--output-dir', 'other/proj']);
        expect(err?.message).to.equal(messages.getMessage('error.clwr-site-required-cwd', ['not set']));
      });

      it('CLWR without a site is allowed when both projects are below 69.0', async () => {
        stubTwoProjects('68.0', '68.0');
        await LightningOut.run([...base, '--runtime', 'CLWR', '--output-dir', 'other/proj']);
        expect(create.calledOnce).to.equal(true);
      });

      it('--site warns when the cwd project is below 69.0 even if --output-dir is at 70.0', async () => {
        stubTwoProjects('70.0', '66.0');
        await LightningOut.run([...guest, '--output-dir', 'other/proj']);
        expect(cmdStubs.warn.args.flat()).to.include(messages.getMessage('warning.cwd-api-version', ['66.0', '69.0']));
      });

      it('--site with an unparsable sourceApiVersion warns that the version is not recognized', async () => {
        stubProject('latest');
        await LightningOut.run(guest);
        expect(cmdStubs.warn.args.flat()).to.include(messages.getMessage('warning.site-unknown-version', ['latest']));
      });

      for (const bad of ['latest', '0x40', '1e1', '66.0abc']) {
        it(`CLWR without a site and an unparsable sourceApiVersion ${JSON.stringify(
          bad
        )} still needs a site`, async () => {
          stubProject(bad);
          let err: Error | undefined;
          try {
            await LightningOut.run([...base, '--runtime', 'CLWR']);
          } catch (e) {
            err = e as Error;
          }
          expect(err?.name).to.equal('Clwr-site-requiredError');
          expect(create.called).to.equal(false);
        });
      }

      it('--site below 69.0 prints no --api-version and drops the 68.0 floor warning', async () => {
        stubProject('66.0');
        await LightningOut.run(guest);
        const deploy = cmdStubs.log.args
          .flat()
          .map(String)
          .find((m) => m.includes('sf project deploy start'));
        expect(deploy).to.not.include('--api-version');
        expect(cmdStubs.warn.args.flat()).to.not.include(messages.getMessage('warning.source-api-version', ['66.0']));
        expect(cmdStubs.warn.args.flat()).to.include(messages.getMessage('warning.site-api-version', ['66.0']));
      });

      it('no site below 68.0 keeps the 68.0 floor warning and prints no pin', async () => {
        stubProject('66.0');
        await LightningOut.run([...base, '--runtime', 'CLWR']);
        const deploy = cmdStubs.log.args
          .flat()
          .map(String)
          .find((m) => m.includes('sf project deploy start'));
        expect(deploy).to.not.include('--api-version');
        expect(cmdStubs.warn.args.flat()).to.include(messages.getMessage('warning.source-api-version', ['66.0']));
      });

      it('an empty --site reaches the generator blank-site error, not the site-required error', async () => {
        create.restore();
        let err: Error | undefined;
        try {
          await LightningOut.run([...guest.slice(0, -1), '']);
        } catch (e) {
          err = e as Error;
        }
        expect(err?.message).to.match(/site must be a non-empty/);
      });

      it('validates access from a flag against runtime from the file (merged runtime)', async () => {
        const file = path.join(os.tmpdir(), `lo-def-${Date.now()}-${Math.random()}.json`);
        fs.writeFileSync(file, JSON.stringify({ appName: 'A', runtime: 'CLWR', site: 'S' }));
        try {
          await LightningOut.run(['--definition-file', file, '--access', 'guest']);
          expect(passedOpts()).to.deep.include({ runtime: 'CLWR', access: 'guest', site: 'S' });
        } finally {
          fs.rmSync(file, { force: true });
        }
      });

      it('a dotted top-level key is not suggested as itself', async () => {
        const file = path.join(os.tmpdir(), `lo-def-${Date.now()}-${Math.random()}.json`);
        fs.writeFileSync(file, JSON.stringify({ 'eca.callbackUrl': 'x' }));
        try {
          await LightningOut.run([...guest, '--definition-file', file]);
        } finally {
          fs.rmSync(file, { force: true });
        }
        expect(cmdStubs.warn.args.flat()).to.include(
          messages.getMessage('warning.unknown-definition-key', ['eca.callbackUrl'])
        );
      });

      it('warns with a suggestion for a near-miss definition-file key', async () => {
        stubProject('69.0');
        const file = path.join(os.tmpdir(), `lo-def-${Date.now()}-${Math.random()}.json`);
        fs.writeFileSync(file, JSON.stringify({ sites: ['S'], eca: { callbackURL: 'x' } }));
        try {
          await LightningOut.run([...guest, '--definition-file', file]);
        } finally {
          fs.rmSync(file, { force: true });
        }
        const warned = cmdStubs.warn.args.flat();
        expect(warned).to.include(messages.getMessage('warning.unknown-definition-key-suggest', ['sites', 'site']));
        expect(warned).to.include(
          messages.getMessage('warning.unknown-definition-key-suggest', ['eca.callbackURL', 'eca.callbackUrl'])
        );
      });

      describe('D3 site-required rule variants', () => {
        const clwr = [...base, '--runtime', 'CLWR'];
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
        const guestNoSite = ['--app-name', 'MyLoApp', '--runtime', 'CLWR', '--access', 'guest'];

        it('guest without a site errors at 69.0, without generating', async () => {
          stubProject('69.0');
          const err = await runErr(guestNoSite);
          expect(err?.message).to.equal(messages.getMessage('error.clwr-site-required', ['69.0']));
          expect(create.called).to.equal(false);
        });

        it('guest without a site and without a project errors with the no-project message', async () => {
          stubProject(undefined);
          const err = await runErr(guestNoSite);
          expect(err?.message).to.equal(messages.getMessage('error.clwr-site-required-no-project'));
          expect(create.called).to.equal(false);
        });

        it('runtime CLWR from the definition file, no site, at 69.0 errors', async () => {
          stubProject('69.0');
          await withDefFile({ appName: 'A', runtime: 'CLWR' }, async (file) => {
            const err = await runErr([...base, '--definition-file', file]);
            expect(err?.message).to.equal(messages.getMessage('error.clwr-site-required', ['69.0']));
          });
          expect(create.called).to.equal(false);
        });

        it('a project without sourceApiVersion gets the no-project error', async () => {
          resolveProject.resolves({ getPath: () => '/proj', resolveProjectConfig: () => Promise.resolve({}) });
          const err = await runErr(clwr);
          expect(err?.message).to.equal(messages.getMessage('error.clwr-site-required-no-project'));
          expect(create.called).to.equal(false);
        });

        it("a non-numeric sourceApiVersion ('latest') errors with the version in the message", async () => {
          stubProject('latest');
          const err = await runErr(clwr);
          expect(err?.message).to.equal(messages.getMessage('error.clwr-site-required', ['latest']));
          expect(err?.message).to.include('latest');
          expect(create.called).to.equal(false);
        });

        it("allows '68.9' but errors for '69'", async () => {
          stubProject('68.9');
          await LightningOut.run(clwr);
          expect(create.calledOnce).to.equal(true);
          create.resetHistory();
          stubProject('69');
          const err = await runErr(clwr);
          expect(err?.message).to.equal(messages.getMessage('error.clwr-site-required', ['69']));
          expect(create.called).to.equal(false);
        });

        it('CLWR without a site and with a bad appName reports only the site error (short-circuits)', async () => {
          stubProject('69.0');
          create.restore();
          const err = await runErr([...clwr.slice(2), '--app-name', 'bad name!']);
          expect(err?.message).to.equal(messages.getMessage('error.clwr-site-required', ['69.0']));
          expect(err?.message).to.not.match(/appName/);
        });

        it('a missing runtime at 69.0 does not raise the site-required error', async () => {
          stubProject('69.0');
          const err = await runErr(base);
          expect(err?.message ?? '').to.not.include('A CLWR app needs a site');
          expect(create.calledOnce).to.equal(true);
        });

        it('LWR_CORE without a project or a site generates', async () => {
          stubProject(undefined);
          await LightningOut.run([...base, '--runtime', 'LWR_CORE']);
          expect(create.calledOnce).to.equal(true);
        });
      });

      describe('version warning and pin negatives', () => {
        const deployCmd = (): string | undefined =>
          cmdStubs.log.args
            .flat()
            .map(String)
            .find((m) => m.includes('sf project deploy start'));

        it('CLWR without a site at 66.0 emits neither site warning', async () => {
          stubProject('66.0');
          await LightningOut.run([...base, '--runtime', 'CLWR']);
          const warned = cmdStubs.warn.args.flat();
          expect(warned).to.not.include(messages.getMessage('warning.site-api-version', ['66.0']));
          expect(warned).to.not.include(messages.getMessage('warning.site-no-project'));
        });

        for (const [label, api, runtime] of [
          ['CLWR at 68.0', '68.0', 'CLWR'],
          ['LWR_CORE at 68.0', '68.0', 'LWR_CORE'],
          ['LWR_CORE at 69.0', '69.0', 'LWR_CORE'],
          ['LWR_CORE with no project', undefined, 'LWR_CORE'],
        ] as Array<[string, string | undefined, string]>) {
          it(`no-site run (${label}) emits no source-api-version warning`, async () => {
            stubProject(api);
            await LightningOut.run([...base, '--runtime', runtime]);
            const warned = cmdStubs.warn.args.flat().map(String);
            expect(warned.some((m) => m.includes('is below 68.0'))).to.equal(false);
          });
        }

        for (const api of ['69.0', '70.0']) {
          it(`--site at ${api} prints no --api-version`, async () => {
            stubProject(api);
            await LightningOut.run(guest);
            expect(deployCmd()).to.not.include('--api-version');
          });
        }

        it("--site with sourceApiVersion 'latest' warns nothing about the site and pins nothing (current behaviour)", async () => {
          stubProject('latest');
          await LightningOut.run(guest);
          const warned = cmdStubs.warn.args.flat();
          expect(warned).to.not.include(messages.getMessage('warning.site-api-version', ['latest']));
          expect(warned).to.not.include(messages.getMessage('warning.site-no-project'));
          expect(deployCmd()).to.not.include('--api-version');
        });
      });

      describe('guidance negatives', () => {
        const infoAll = (): unknown[] => cmdStubs.info.args.flat();
        const warnAll = (): unknown[] => cmdStubs.warn.args.flat();

        it('with a site, success.clwr-site is absent', async () => {
          await LightningOut.run(guest);
          expect(infoAll()).to.not.include(messages.getMessage('success.clwr-site'));
        });

        it('without a site (66.0), the linked and relink lines are absent', async () => {
          stubProject('66.0');
          await LightningOut.run([...base, '--runtime', 'CLWR']);
          expect(infoAll()).to.not.include(messages.getMessage('success.clwr-site-linked', ['My Site']));
          expect(infoAll()).to.not.include(messages.getMessage('success.site-relink'));
          expect(
            infoAll()
              .map(String)
              .some((m) => m.startsWith('Deploying the app links it'))
          ).to.equal(false);
        });

        it('success.access-default is absent for LWR_CORE and for explicit --access guest', async () => {
          await LightningOut.run([...base, '--runtime', 'LWR_CORE']);
          expect(infoAll()).to.not.include(messages.getMessage('success.access-default'));
          cmdStubs.info.resetHistory();
          await LightningOut.run(guest);
          expect(infoAll()).to.not.include(messages.getMessage('success.access-default'));
        });

        it('success.clwr-guest-public is absent for LWR_CORE and for authenticated CLWR', async () => {
          await LightningOut.run([...base, '--runtime', 'LWR_CORE']);
          expect(infoAll()).to.not.include(messages.getMessage('success.clwr-guest-public'));
          cmdStubs.info.resetHistory();
          await LightningOut.run([...base, '--runtime', 'CLWR', '--site', 'S']);
          expect(infoAll()).to.not.include(messages.getMessage('success.clwr-guest-public'));
        });

        it('guest-eca-ignored is absent for guest without eca input', async () => {
          await LightningOut.run(guest);
          expect(
            warnAll()
              .map(String)
              .some((m) => m.includes('these inputs are ignored'))
          ).to.equal(false);
        });

        it('guest-eca-ignored is absent for authenticated runs with eca input', async () => {
          await LightningOut.run([...base, '--runtime', 'CLWR', '--site', 'S']);
          expect(
            warnAll()
              .map(String)
              .some((m) => m.includes('these inputs are ignored'))
          ).to.equal(false);
        });

        const staleCases: Array<[string, string, string]> = [
          ['corsWhitelistOrigins/', 'corsWhitelistOrigins', 'Old.corsWhitelistOrigin-meta.xml'],
          ['externalClientApps/', 'externalClientApps', 'Old.eca-meta.xml'],
          ['extlClntAppGlobalOauthSets/', 'extlClntAppGlobalOauthSets', 'Old.ecaGlblOauth-meta.xml'],
          ['extlClntAppOauthSettings/', 'extlClntAppOauthSettings', 'Old.ecaOauth-meta.xml'],
          ['settings/MyDomain', 'settings', 'MyDomain.settings-meta.xml'],
          ['settings/Security', 'settings', 'Security.settings-meta.xml'],
        ];
        for (const [label, dirName, fileName] of staleCases) {
          it(`guest: ${label} alone triggers guest-stale-files`, async () => {
            const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'lo-stale-'));
            try {
              fs.mkdirSync(path.join(dir, dirName));
              fs.writeFileSync(path.join(dir, dirName, fileName), '');
              await LightningOut.run([...guest, '--output-dir', dir]);
              expect(warnAll()).to.include(
                messages.getMessage('warning.guest-stale-files', [dir, path.join(dirName, fileName)])
              );
            } finally {
              fs.rmSync(dir, { recursive: true, force: true });
            }
          });
        }
      });

      describe('definition-file and flag precedence through run()', () => {
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

        it('--access authenticated beats file access guest (ECA guidance present)', async () => {
          await withDefFile({ runtime: 'CLWR', site: 'S', access: 'guest' }, async (file) => {
            await LightningOut.run([...base, '--definition-file', file, '--access', 'authenticated']);
          });
          expect(passedOpts()).to.deep.include({ access: 'authenticated', site: 'S' });
          const info = cmdStubs.info.args.flat();
          expect(info).to.include(messages.getMessage('success.dont-delete'));
          expect(info).to.include(messages.getMessage('success.eca-overwrite', ['MyLoAppEca']));
        });

        it("--site '' beats file site 'S' and hits the generator blank-site error", async () => {
          create.restore();
          await withDefFile({ runtime: 'CLWR', site: 'S' }, async (file) => {
            const err = await runErr([...base, '--definition-file', file, '--site', '']);
            expect(err?.message).to.match(/site must be a non-empty/);
          });
        });

        it('--runtime LWR_CORE beats file runtime CLWR and the generator rejects the file site', async () => {
          create.restore();
          await withDefFile({ runtime: 'CLWR', site: 'S' }, async (file) => {
            const err = await runErr([...base, '--definition-file', file, '--runtime', 'LWR_CORE']);
            expect(err?.message).to.match(/site applies only to runtime CLWR/);
          });
        });

        it('file runtime LWR_CORE with --access guest is rejected as CLWR-only', async () => {
          create.restore();
          await withDefFile({ runtime: 'LWR_CORE' }, async (file) => {
            const err = await runErr([...base, '--definition-file', file, '--access', 'guest']);
            expect(err?.message).to.match(/access applies only to runtime CLWR/);
          });
        });

        it('file site: null is a definition-file type error', async () => {
          await withDefFile({ runtime: 'CLWR', site: null }, async (file) => {
            const err = await runErr([...base, '--definition-file', file]);
            expect(err?.name).to.equal('Definition-file-field-typeError');
            expect(err?.message).to.equal(
              messages.getMessage('error.definition-file-field-type', ['site', 'a string'])
            );
          });
          expect(create.called).to.equal(false);
        });

        it("file access: 'public' reaches the generator access error", async () => {
          create.restore();
          await withDefFile({ runtime: 'CLWR', site: 'S', access: 'public' }, async (file) => {
            const err = await runErr([...base, '--definition-file', file]);
            expect(err?.message).to.match(/access must be one of: guest, authenticated/);
          });
        });

        it('a bad file site (123) is skipped when --site is given', async () => {
          await withDefFile({ runtime: 'CLWR', site: 123 }, async (file) => {
            await LightningOut.run([...base, '--definition-file', file, '--site', 'X']);
          });
          expect(passedOpts()).to.deep.include({ site: 'X' });
        });

        it('a null file access is skipped when --access is given', async () => {
          await withDefFile({ runtime: 'CLWR', site: 'S', access: null }, async (file) => {
            await LightningOut.run([...base, '--definition-file', file, '--access', 'guest']);
          });
          expect(passedOpts()).to.deep.include({ access: 'guest', site: 'S' });
        });

        it("keys 'Site' and 'Access' warn with a did-you-mean", async () => {
          await withDefFile({ Site: 'x', Access: 'guest' }, async (file) => {
            await LightningOut.run([...guest, '--definition-file', file]);
          });
          const warned = cmdStubs.warn.args.flat();
          expect(warned).to.include(messages.getMessage('warning.unknown-definition-key-suggest', ['Site', 'site']));
          expect(warned).to.include(
            messages.getMessage('warning.unknown-definition-key-suggest', ['Access', 'access'])
          );
        });

        it('an unrecognized nested eca key gets the plain unknown-key warning', async () => {
          await withDefFile({ eca: { scopes: 'x' } }, async (file) => {
            await LightningOut.run([...guest, '--definition-file', file]);
          });
          expect(cmdStubs.warn.args.flat()).to.include(
            messages.getMessage('warning.unknown-definition-key', ['eca.scopes'])
          );
        });
      });
    });

    it('points to the App ID location and the app-id attribute', () => {
      expect(messages.getMessage('success.app-id'))
        .to.include('Lightning Out 2.0 App Manager')
        .and.to.include('"app-id"');
    });
  });

  it('keeps the runtime flag summary short and puts the detail in its description', () => {
    expect(LightningOut.flags.runtime.summary).to.not.include('Setup');
    expect(LightningOut.flags.runtime.description).to.include('--site').and.to.include('--access');
  });

  describe('flag declarations', () => {
    it('site is a single-valued string flag', () => {
      expect((LightningOut.flags.site as { multiple?: boolean }).multiple).to.not.equal(true);
    });
    it('access accepts only guest and authenticated', () => {
      expect(LightningOut.flags.access.options).to.deep.equal(['guest', 'authenticated']);
    });
    it('runtime options are unchanged', () => {
      expect(LightningOut.flags.runtime.options).to.deep.equal(['LWR_CORE', 'CLWR']);
    });
  });

  describe('mergeLightningOutInputs', () => {
    it('takes appName/eca.name from flags over the definition file', () => {
      const { opts } = mergeLightningOutInputs(
        { appName: 'FromFile', eca: { name: 'EcaFile', contactEmail: 'f@f.com', callbackUrl: 'https://f.com/cb' } },
        { 'app-name': 'FromFlag', 'eca-name': 'EcaFlag' }
      );
      expect(opts.appName).to.equal('FromFlag');
      expect(opts.eca?.name).to.equal('EcaFlag');
      expect(opts.eca?.contactEmail).to.equal('f@f.com'); // unspecified flag falls back to file
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

  describe('site/access helpers', () => {
    it('suggestKey: on an edit-distance tie, the first known key wins', () => {
      expect(suggestKey('ab', ['ac', 'ad'])).to.equal('ac');
    });
    it('suggestKey: case-insensitive match, then edit distance <= 2, else undefined', () => {
      const known = ['appName', 'runtime', 'hostDomains', 'components', 'eca', 'site', 'access'];
      expect(suggestKey('Site', known)).to.equal('site');
      expect(suggestKey('sites', known)).to.equal('site');
      expect(suggestKey('hostDomain', known)).to.equal('hostDomains');
      expect(suggestKey('acess', known)).to.equal('access');
      expect(suggestKey('bogus', known)).to.equal(undefined);
    });
    it('unknownKeyWarning suggests within eca.* for nested keys', () => {
      expect(unknownKeyWarning('Name', true)).to.equal(
        messages.getMessage('warning.unknown-definition-key-suggest', ['eca.Name', 'eca.name'])
      );
      expect(unknownKeyWarning('scopes', true)).to.equal(
        messages.getMessage('warning.unknown-definition-key', ['eca.scopes'])
      );
    });
    it('mergeLightningOutInputs normalizes null site/access to undefined', () => {
      const { opts } = mergeLightningOutInputs({ site: null, access: null }, {});
      expect(opts.site).to.equal(undefined);
      expect(opts.access).to.equal(undefined);
    });
    it('mergeLightningOutInputs reports unknown nested eca keys and passes site/access through', () => {
      const { opts, unknownKeys, unknownEcaKeys } = mergeLightningOutInputs(
        { site: 'S', access: 'guest', eca: { name: 'E', scopes: 'x', distributionState: 'y' } },
        {}
      );
      expect(unknownKeys).to.deep.equal([]);
      expect(unknownEcaKeys).to.have.members(['scopes', 'distributionState']);
      expect(opts).to.deep.include({ site: 'S', access: 'guest' });
    });
    it('validateDefinitionShape type-checks site and access (null is not "unlink")', () => {
      expect(() => validateDefinitionShape({ site: ['a'] }, {})).to.throw(/site/);
      expect(() => validateDefinitionShape({ site: null }, {})).to.throw(/site/);
      expect(() => validateDefinitionShape({ access: true }, {})).to.throw(/access/);
      expect(() => validateDefinitionShape({ site: 1 }, { site: 'ok' })).to.not.throw();
    });
    it('isBelowSitesApi', () => {
      expect(isBelowSitesApi('68.0')).to.equal(true);
      expect(isBelowSitesApi('69.0')).to.equal(false);
      expect(isBelowSitesApi('70')).to.equal(false);
      expect(isBelowSitesApi(undefined)).to.equal(false);
      // non-numeric fails safe: not "below", so CLWR without a site errors
      expect(isBelowSitesApi('latest')).to.equal(false);
      expect(isBelowSitesApi('0x40')).to.equal(false);
      expect(isBelowSitesApi('1e1')).to.equal(false);
      expect(isBelowSitesApi(' 68.0 ')).to.equal(true);
    });
    it('ignoredGuestEcaInputs names flags first, else definition-file keys', () => {
      expect(
        ignoredGuestEcaInputs({ eca: { name: 'E', callbackUrl: 'u' } }, { 'eca-name': 'F', 'eca-contact-email': 'x' })
      ).to.deep.equal(['--eca-name', '--eca-contact-email', 'eca.callbackUrl']);
      expect(ignoredGuestEcaInputs({}, {})).to.deep.equal([]);
    });
    it('findAuthOnlyFiles lists only authenticated-only artifacts', () => {
      const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'lo-auth-only-'));
      try {
        fs.mkdirSync(path.join(dir, 'corsWhitelistOrigins'));
        fs.writeFileSync(path.join(dir, 'corsWhitelistOrigins', 'a.corsWhitelistOrigin-meta.xml'), '');
        fs.mkdirSync(path.join(dir, 'settings'));
        fs.writeFileSync(path.join(dir, 'settings', 'Security.settings-meta.xml'), '');
        fs.writeFileSync(path.join(dir, 'settings', 'Other.settings-meta.xml'), '');
        fs.mkdirSync(path.join(dir, 'lightningOutApps'));
        fs.writeFileSync(path.join(dir, 'lightningOutApps', 'A.lightningOutApp-meta.xml'), '');
        expect(findAuthOnlyFiles(dir)).to.deep.equal([
          path.join('corsWhitelistOrigins', 'a.corsWhitelistOrigin-meta.xml'),
          path.join('settings', 'Security.settings-meta.xml'),
        ]);
        expect(findAuthOnlyFiles(path.join(dir, 'missing'))).to.deep.equal([]);
        // advisory scan: an unreadable directory is treated as "nothing found", never thrown
        const locked = path.join(dir, 'externalClientApps');
        fs.mkdirSync(locked);
        fs.chmodSync(locked, 0o000);
        try {
          if (process.platform !== 'win32' && process.getuid?.() !== 0) {
            expect(findAuthOnlyFiles(dir)).to.deep.equal([]);
          }
        } finally {
          fs.chmodSync(locked, 0o755);
          fs.rmdirSync(locked);
        }
        // non-metadata files such as .DS_Store are not reported
        fs.writeFileSync(path.join(dir, 'corsWhitelistOrigins', '.DS_Store'), '');
        expect(findAuthOnlyFiles(dir)).to.have.length(2);
      } finally {
        fs.rmSync(dir, { recursive: true, force: true });
      }
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

    it('treats unparsable versions as unknown, not below the floor', () => {
      for (const bad of ['garbage', '0x40', '1e1', '64.0.1']) {
        expect(isBelowApiFloor(bad)).to.equal(false);
      }
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

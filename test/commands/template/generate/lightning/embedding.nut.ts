/*
 * Copyright (c) 2026, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import path from 'node:path';
import { expect, config } from 'chai';
import { TestSession, execCmd } from '@salesforce/cli-plugins-testkit';
import assert from 'yeoman-assert';

config.truncateThreshold = 0;

describe('template generate lightning embedding:', () => {
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

  const lwcDir = (): string => path.join(session.project.dir, 'lwc');
  const bundleFiles = (componentName: string): string[] => {
    const camel = componentName.charAt(0).toLowerCase() + componentName.slice(1);
    return ['.html', '.js', '.css', '.js-meta.xml'].map((suffix) => path.join(lwcDir(), camel, camel + suffix));
  };

  describe('Check lightning embedding creation', () => {
    const name = 'MyEmbedding';
    const src = 'https://app.example.com';
    const shellTitle = 'Demo Embedding';

    it('should scaffold an embedding LWC bundle with all four files', () => {
      execCmd(
        `template generate lightning embedding --name ${name} --src ${src} --sandbox allow-forms --shell-title "${shellTitle}" --output-dir ${lwcDir()}`,
        { ensureExitCode: 0 }
      );
      assert.file(bundleFiles(name));
    });

    it('should emit a <lightning-embedding> element in the generated html', () => {
      execCmd(
        `template generate lightning embedding --name ${name} --src ${src} --sandbox allow-forms --shell-title "${shellTitle}" --output-dir ${lwcDir()}`,
        { ensureExitCode: 0 }
      );
      const camel = name.charAt(0).toLowerCase() + name.slice(1);
      assert.fileContent(path.join(lwcDir(), camel, `${camel}.html`), '<lightning-ui-embedding');
    });

    it('should join multiple --sandbox tokens into a single space-separated attribute', () => {
      execCmd(
        `template generate lightning embedding --name MultiSandbox --src ${src} --sandbox allow-forms --sandbox allow-scripts --shell-title "${shellTitle}" --output-dir ${lwcDir()}`,
        { ensureExitCode: 0 }
      );
      assert.fileContent(
        path.join(lwcDir(), 'multiSandbox', 'multiSandbox.html'),
        'sandbox="allow-forms allow-scripts"'
      );
    });

    it('should bind the src URL into the generated js as a reactive property', () => {
      execCmd(
        `template generate lightning embedding --name SrcBinding --src ${src} --sandbox allow-forms --shell-title "${shellTitle}" --output-dir ${lwcDir()}`,
        { ensureExitCode: 0 }
      );
      assert.fileContent(path.join(lwcDir(), 'srcBinding', 'srcBinding.js'), src);
    });

    it('should accept http URLs on localhost for local development', () => {
      execCmd(
        `template generate lightning embedding --name LocalDev --src http://localhost:3000 --sandbox allow-forms --shell-title "${shellTitle}" --output-dir ${lwcDir()}`,
        { ensureExitCode: 0 }
      );
      assert.fileContent(path.join(lwcDir(), 'localDev', 'localDev.js'), 'http://localhost:3000');
    });
  });

  describe('lightning embedding failures', () => {
    const baseFlags = '--name Foo --sandbox allow-forms --shell-title "Demo"';

    it('should throw missing --name error', () => {
      const stderr = execCmd(
        'template generate lightning embedding --src https://app.example.com --sandbox allow-forms --shell-title "Demo"'
      ).shellOutput.stderr;
      expect(stderr).to.contain('Missing required flag');
    });

    it('should throw missing --src error', () => {
      const stderr = execCmd(
        'template generate lightning embedding --name Foo --sandbox allow-forms --shell-title "Demo"'
      ).shellOutput.stderr;
      expect(stderr).to.contain('Missing required flag');
    });

    it('should throw missing --sandbox error', () => {
      const stderr = execCmd(
        'template generate lightning embedding --name Foo --src https://app.example.com --shell-title "Demo"'
      ).shellOutput.stderr;
      expect(stderr).to.contain('Missing required flag');
    });

    it('should throw missing --shell-title error (no fallback to --name)', () => {
      const stderr = execCmd(
        'template generate lightning embedding --name Foo --src https://app.example.com --sandbox allow-forms'
      ).shellOutput.stderr;
      expect(stderr).to.contain('Missing required flag');
    });

    it('should reject http src on a non-localhost host', () => {
      const stderr = execCmd(
        `template generate lightning embedding --name Foo --src http://attacker.com --sandbox allow-forms --shell-title "Demo" --output-dir ${lwcDir()}`
      ).shellOutput.stderr;
      expect(stderr).to.contain('HTTPS URL');
    });

    it('should reject non-http(s) protocols', () => {
      const stderr = execCmd(
        `template generate lightning embedding --name Foo --src ftp://example.com --sandbox allow-forms --shell-title "Demo" --output-dir ${lwcDir()}`
      ).shellOutput.stderr;
      expect(stderr).to.contain('HTTPS URL');
    });

    it('should reject malformed --src input', () => {
      const stderr = execCmd(
        `template generate lightning embedding --name Foo --src not-a-url --sandbox allow-forms --shell-title "Demo" --output-dir ${lwcDir()}`
      ).shellOutput.stderr;
      expect(stderr).to.contain('HTTPS URL');
    });

    it('should reject an unknown sandbox token', () => {
      const stderr = execCmd(
        `template generate lightning embedding ${baseFlags} --src https://app.example.com --sandbox allow-everything --output-dir ${lwcDir()}`,
        { ensureExitCode: 'nonZero' }
      ).shellOutput.stderr;
      expect(stderr).to.contain('Expected --sandbox');
    });

    it('should throw missing lwc parent folder error when output-dir is not under lwc/', () => {
      const stderr = execCmd(
        `template generate lightning embedding --name Foo --src https://app.example.com --sandbox allow-forms --shell-title "Demo" --output-dir ${path.join(
          session.project.dir,
          'somewhere-else'
        )}`
      ).shellOutput.stderr;
      expect(stderr).to.match(/lwc/i);
    });
  });
});

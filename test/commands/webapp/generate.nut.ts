/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import path from 'node:path';
import { expect } from 'chai';
import { TestSession, execCmd } from '@salesforce/cli-plugins-testkit';
import fs from 'fs-extra';

type JsonErrorOutput = {
  status: number;
  name: string;
  message: string;
  actions?: string[];
};

describe('webapp generate', () => {
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

  describe('flag validation', () => {
    it('should throw "Missing required flag name" when --name is not provided', () => {
      const result = execCmd('webapp generate --label "My App"');
      expect(result.shellOutput.stderr).to.contain('Missing required flag name');
    });

    it('should throw "Missing required flag label" when --label is not provided', () => {
      const result = execCmd('webapp generate --name myApp');
      expect(result.shellOutput.stderr).to.contain('Missing required flag label');
    });

    it('should list valid options when --template value is invalid', () => {
      const result = execCmd('webapp generate --name myApp --label "My App" --template invalid');
      expect(result.shellOutput.stderr).to.contain('Expected --template=invalid to be one of: react-basic, lwc-basic');
    });

    it('should report both missing flags when neither --name nor --label is provided', () => {
      const result = execCmd('webapp generate');
      expect(result.shellOutput.stderr).to.contain('Missing required flag name');
      expect(result.shellOutput.stderr).to.contain('Missing required flag label');
    });

    it('should accept react-basic as valid --template value', () => {
      const result = execCmd('webapp generate --name test --label "Test" --template react-basic --json');
      expect(result.shellOutput.stderr).to.not.contain('Expected --template');
    });

    it('should accept lwc-basic as valid --template value', () => {
      const result = execCmd('webapp generate --name test --label "Test" --template lwc-basic --json');
      expect(result.shellOutput.stderr).to.not.contain('Expected --template');
    });
  });

  describe('help output', () => {
    it('should display all available flags with their short forms', () => {
      const result = execCmd('webapp generate --help', { ensureExitCode: 0 });
      const stdout = result.shellOutput.stdout;

      expect(stdout).to.contain('-n, --name');
      expect(stdout).to.contain('-l, --label');
      expect(stdout).to.contain('-t, --template');
      expect(stdout).to.contain('-d, --output-dir');
      expect(stdout).to.contain('-f, --force');
    });

    it('should show only react-basic and lwc-basic as selectable template options', () => {
      const result = execCmd('webapp generate --help', { ensureExitCode: 0 });
      expect(result.shellOutput.stdout).to.contain('<options: react-basic|lwc-basic>');
    });

    it('should display command summary', () => {
      const result = execCmd('webapp generate --help', { ensureExitCode: 0 });
      expect(result.shellOutput.stdout).to.contain('Create a web app and associated metadata');
    });

    it('should display EXAMPLES section with sample commands', () => {
      const result = execCmd('webapp generate --help', { ensureExitCode: 0 });
      expect(result.shellOutput.stdout).to.contain('EXAMPLES');
      expect(result.shellOutput.stdout).to.contain('sf webapp generate --name');
    });

    it('should show current directory as default for --output-dir', () => {
      const result = execCmd('webapp generate --help', { ensureExitCode: 0 });
      expect(result.shellOutput.stdout).to.contain('default: .');
    });
  });

  describe('JSON error output', () => {
    it('should return TemplateCloneError with status 1 when template repository is unreachable', () => {
      const result = execCmd('webapp generate --name myApp --label "My App" --json');
      const output = JSON.parse(result.shellOutput.stdout) as JsonErrorOutput;

      expect(output.status).to.equal(1);
      expect(output.name).to.equal('TemplateCloneError');
      expect(output.message).to.contain('Failed to download template');
    });
  });

  describe('flag shorthands', () => {
    it('should accept -n as shorthand for --name', () => {
      const result = execCmd('webapp generate -n test --label "Test" --json');
      expect(result.shellOutput.stderr).to.not.contain('Unexpected argument: -n');
    });

    it('should accept -l as shorthand for --label', () => {
      const result = execCmd('webapp generate --name test -l "Test" --json');
      expect(result.shellOutput.stderr).to.not.contain('Unexpected argument: -l');
    });

    it('should accept -t as shorthand for --template', () => {
      const result = execCmd('webapp generate --name test --label "Test" -t react-basic --json');
      expect(result.shellOutput.stderr).to.not.contain('Unexpected argument: -t');
    });

    it('should accept -d as shorthand for --output-dir', () => {
      const result = execCmd('webapp generate --name test --label "Test" -d ./custom --json');
      expect(result.shellOutput.stderr).to.not.contain('Unexpected argument: -d');
    });

    it('should accept -f as shorthand for --force', () => {
      const result = execCmd('webapp generate --name test --label "Test" -f --json');
      expect(result.shellOutput.stderr).to.not.contain('Unexpected argument: -f');
    });
  });

  describe('directory exists handling', () => {
    it('should return DirectoryExistsError when web app directory exists without --force', async () => {
      const appName = 'existingApp';
      const existingDir = path.join(session.project.dir, 'webApplications', appName);
      await fs.ensureDir(existingDir);
      await fs.writeFile(path.join(existingDir, 'existing-file.txt'), 'existing content');

      const result = execCmd(
        `webapp generate --name ${appName} --label "Existing App" --output-dir "${session.project.dir}" --json`
      );
      const output = JSON.parse(result.shellOutput.stdout) as JsonErrorOutput;

      expect(output.status).to.equal(1);
      expect(output.name).to.equal('DirectoryExistsError');
      expect(output.message).to.equal(`Directory '${existingDir}' already exists.`);

      // Verify the existing file was NOT deleted
      const fileStillExists = await fs.pathExists(path.join(existingDir, 'existing-file.txt'));
      expect(fileStillExists).to.be.true;
    });

    it('should suggest "Use --force to overwrite" in error actions when directory exists', async () => {
      const appName = 'anotherExisting';
      const existingDir = path.join(session.project.dir, 'webApplications', appName);
      await fs.ensureDir(existingDir);

      const result = execCmd(
        `webapp generate --name ${appName} --label "Another" --output-dir "${session.project.dir}" --json`
      );
      const output = JSON.parse(result.shellOutput.stdout) as JsonErrorOutput;

      expect(output.actions).to.be.an('array').with.lengthOf(1);
      expect(output.actions?.[0]).to.equal('Use --force to overwrite the existing directory.');
    });
  });
});

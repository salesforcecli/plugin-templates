/*
 * Copyright (c) 2026, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import path from 'node:path';
import fs from 'node:fs';
import { expect } from 'chai';
import { TestSession, execCmd } from '@salesforce/cli-plugins-testkit';
import assert from 'yeoman-assert';

const COMMAND = 'template generate digital-experience site';

describe(COMMAND, () => {
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

  describe('--template BuildYourOwnLWR', () => {
    it('should create with all required files', () => {
      const outputDir = path.join(session.project.dir, 'force-app', 'main', 'default');
      execCmd(
        `${COMMAND} --template BuildYourOwnLWR --name "123 @ Test Site" --url-path-prefix 123testsite --output-dir "${outputDir}"`,
        {
          ensureExitCode: 0,
        }
      );

      const bundlePath = path.join(outputDir, 'digitalExperiences', 'site', 'X123_Test_Site1');

      // Check top-level metadata files
      assert.file([
        path.join(outputDir, 'networks', '123 %40 Test Site.network-meta.xml'),
        path.join(outputDir, 'sites', 'X123_Test_Site.site-meta.xml'),
        path.join(outputDir, 'digitalExperienceConfigs', 'X123_Test_Site1.digitalExperienceConfig-meta.xml'),
        path.join(bundlePath, 'X123_Test_Site1.digitalExperience-meta.xml'),
      ]);

      // Check DEB components
      assert.file([
        path.join(bundlePath, 'sfdc_cms__appPage', 'mainAppPage', 'content.json'),
        path.join(bundlePath, 'sfdc_cms__appPage', 'mainAppPage', '_meta.json'),
        path.join(bundlePath, 'sfdc_cms__brandingSet', 'Build_Your_Own_LWR', 'content.json'),
        path.join(bundlePath, 'sfdc_cms__brandingSet', 'Build_Your_Own_LWR', '_meta.json'),
        path.join(bundlePath, 'sfdc_cms__languageSettings', 'languages', 'content.json'),
        path.join(bundlePath, 'sfdc_cms__languageSettings', 'languages', '_meta.json'),
        path.join(bundlePath, 'sfdc_cms__mobilePublisherConfig', 'mobilePublisherConfig', 'content.json'),
        path.join(bundlePath, 'sfdc_cms__mobilePublisherConfig', 'mobilePublisherConfig', '_meta.json'),
        path.join(bundlePath, 'sfdc_cms__theme', 'Build_Your_Own_LWR', 'content.json'),
        path.join(bundlePath, 'sfdc_cms__theme', 'Build_Your_Own_LWR', '_meta.json'),
        path.join(bundlePath, 'sfdc_cms__site', 'X123_Test_Site1', 'content.json'),
        path.join(bundlePath, 'sfdc_cms__site', 'X123_Test_Site1', '_meta.json'),
      ]);

      // Check routes
      const routes = [
        'Check_Password',
        'Error',
        'Forgot_Password',
        'Home',
        'Login',
        'News_Detail__c',
        'Register',
        'Service_Not_Available',
        'Too_Many_Requests',
      ];
      for (const route of routes) {
        assert.file([
          path.join(bundlePath, 'sfdc_cms__route', route, 'content.json'),
          path.join(bundlePath, 'sfdc_cms__route', route, '_meta.json'),
        ]);
      }

      // Check theme layouts
      const layouts = ['scopedHeaderAndFooter', 'snaThemeLayout'];
      for (const layout of layouts) {
        assert.file([
          path.join(bundlePath, 'sfdc_cms__themeLayout', layout, 'content.json'),
          path.join(bundlePath, 'sfdc_cms__themeLayout', layout, '_meta.json'),
        ]);
      }

      // Check views
      const views = [
        'checkPasswordResetEmail',
        'error',
        'forgotPassword',
        'home',
        'login',
        'newsDetail',
        'register',
        'serviceNotAvailable',
        'tooManyRequests',
      ];
      for (const view of views) {
        assert.file([
          path.join(bundlePath, 'sfdc_cms__view', view, 'content.json'),
          path.join(bundlePath, 'sfdc_cms__view', view, '_meta.json'),
        ]);
      }
    });
  });

  describe('parameter validation', () => {
    it('should throw error if missing site name', () => {
      const stderr = execCmd(`${COMMAND} --template BuildYourOwnLWR --url-path-prefix test`).shellOutput.stderr;
      expect(stderr).to.contain('Missing required flag');
    });

    it('should throw error if missing template', () => {
      const stderr = execCmd(`${COMMAND} --name test --url-path-prefix test`).shellOutput.stderr;
      expect(stderr).to.contain('Missing required flag');
    });

    it('should default to empty string if url-path-prefix is not provided', () => {
      const outputDir = path.join(session.project.dir, 'force-app', 'main', 'default');
      execCmd(`${COMMAND} --template BuildYourOwnLWR --name "DefaultPrefixSite" --output-dir "${outputDir}"`, {
        ensureExitCode: 0,
      });

      const networkPath = path.join(outputDir, 'networks', 'DefaultPrefixSite.network-meta.xml');
      const networkContent = fs.readFileSync(networkPath, 'utf8');
      expect(networkContent).to.include('<urlPathPrefix>vforcesite</urlPathPrefix>');

      const configPath = path.join(
        outputDir,
        'digitalExperienceConfigs',
        'DefaultPrefixSite1.digitalExperienceConfig-meta.xml'
      );
      const configContent = fs.readFileSync(configPath, 'utf8');
      expect(configContent).to.include('<urlPathPrefix></urlPathPrefix>');
    });

    it('should default to force/main/default if output-dir is not provided', () => {
      execCmd(`${COMMAND} --template BuildYourOwnLWR --name "DefaultDirSite" --url-path-prefix defaultdir`, {
        ensureExitCode: 0,
      });
      const defaultOutputDir = path.join(session.project.dir, 'force-app', 'main', 'default');
      assert.file(path.join(defaultOutputDir, 'networks', 'DefaultDirSite.network-meta.xml'));
      assert.file(path.join(defaultOutputDir, 'sites', 'DefaultDirSite.site-meta.xml'));
    });
  });
});

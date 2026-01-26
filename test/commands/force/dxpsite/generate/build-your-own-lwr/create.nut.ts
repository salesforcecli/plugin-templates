/*
 * Copyright (c) 2026, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import path from 'node:path';
import { expect } from 'chai';
import { TestSession, execCmd } from '@salesforce/cli-plugins-testkit';
import { nls } from '@salesforce/templates/lib/i18n/index.js';
import assert from 'yeoman-assert';

describe('DXP Site build-your-own-lwr', () => {
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

  it('should create dxpsite with all required files', () => {
    const outputDir = path.join(session.project.dir, 'force-app', 'main', 'default');
    execCmd(
      `dxpsite generate build-your-own-lwr --name "My Test Site" --url-path-prefix mytestsite --output-dir "${outputDir}"`,
      {
        ensureExitCode: 0,
      }
    );

    const bundlePath = path.join(outputDir, 'digitalExperiences', 'site', 'My_Test_Site1');

    // Check top-level metadata files
    assert.file([
      path.join(outputDir, 'networks', 'My Test Site.network-meta.xml'),
      path.join(outputDir, 'sites', 'My_Test_Site.site-meta.xml'),
      path.join(outputDir, 'digitalExperienceConfigs', 'My_Test_Site1.digitalExperienceConfig-meta.xml'),
      path.join(bundlePath, 'My_Test_Site1.digitalExperience-meta.xml'),
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
      path.join(bundlePath, 'sfdc_cms__site', 'My_Test_Site1', 'content.json'),
      path.join(bundlePath, 'sfdc_cms__site', 'My_Test_Site1', '_meta.json'),
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

  describe('parameter name', () => {
    it('should handle site names starting with special characters', () => {
      const outputDir = path.join(session.project.dir, 'force-app', 'main', 'default');
      execCmd(
        `dxpsite generate build-your-own-lwr --name "123 @ Test's Site" --url-path-prefix site123 --output-dir "${outputDir}"`,
        {
          ensureExitCode: 0,
        }
      );

      // Site dev name should be prefixed with X when starting with a number
      const bundlePath = path.join(outputDir, 'digitalExperiences', 'site', 'X123_Test_s_Site1');
      assert.file([
        path.join(outputDir, 'networks', '123 %40 Test%27s Site.network-meta.xml'),
        path.join(outputDir, 'sites', 'X123_Test_s_Site.site-meta.xml'),
        path.join(outputDir, 'digitalExperienceConfigs', 'X123_Test_s_Site1.digitalExperienceConfig-meta.xml'),
        path.join(bundlePath, 'X123_Test_s_Site1.digitalExperience-meta.xml'),
      ]);
    });

    it('should throw error if missing', () => {
      const stderr = execCmd('dxpsite generate build-your-own-lwr --url-path-prefix test').shellOutput.stderr;
      expect(stderr).to.contain('Missing required flag');
    });
  });

  describe('parameter url-path-prefix', () => {
    it('should throw error for non-alphanumeric characters', () => {
      const outputDir = path.join(session.project.dir, 'force-app', 'main', 'default');
      const stderr = execCmd(
        `dxpsite generate build-your-own-lwr --name TestSite --url-path-prefix "my-prefix" --output-dir "${outputDir}"`
      ).shellOutput.stderr;
      expect(stderr).to.contain(nls.localize('AlphaNumericValidationError', 'url-path-prefix'));
    });

    it('should throw error for underscores', () => {
      const outputDir = path.join(session.project.dir, 'force-app', 'main', 'default');
      const stderr = execCmd(
        `dxpsite generate build-your-own-lwr --name TestSite --url-path-prefix "my_prefix" --output-dir "${outputDir}"`
      ).shellOutput.stderr;
      expect(stderr).to.contain(nls.localize('AlphaNumericValidationError', 'url-path-prefix'));
    });

    it('should throw error for spaces', () => {
      const outputDir = path.join(session.project.dir, 'force-app', 'main', 'default');
      const stderr = execCmd(
        `dxpsite generate build-your-own-lwr --name TestSite --url-path-prefix "my prefix" --output-dir "${outputDir}"`
      ).shellOutput.stderr;
      expect(stderr).to.contain(nls.localize('AlphaNumericValidationError', 'url-path-prefix'));
    });
  });
});

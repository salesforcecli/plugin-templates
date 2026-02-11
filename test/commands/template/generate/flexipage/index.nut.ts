/*
 * Copyright (c) 2019, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import path from 'node:path';
import { expect } from 'chai';
import { TestSession, execCmd } from '@salesforce/cli-plugins-testkit';
import assert from 'yeoman-assert';

describe('template generate flexipage:', () => {
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

  describe('RecordPage creation', () => {
    it('should create a RecordPage flexipage with required flags', () => {
      execCmd('template generate flexipage --name AccountPage --template RecordPage --sobject Account', {
        ensureExitCode: 0,
      });
      const filePath = path.join(session.project.dir, 'flexipages', 'AccountPage.flexipage-meta.xml');
      assert.file(filePath);
      assert.fileContent(filePath, '<FlexiPage');
      assert.fileContent(filePath, '<type>RecordPage</type>');
      assert.fileContent(filePath, '<sobjectType>Account</sobjectType>');
    });

    it('should create a RecordPage with custom output directory', () => {
      execCmd(
        'template generate flexipage --name ContactPage --template RecordPage --sobject Contact --output-dir custom',
        { ensureExitCode: 0 }
      );
      const filePath = path.join(session.project.dir, 'custom', 'flexipages', 'ContactPage.flexipage-meta.xml');
      assert.file(filePath);
      assert.fileContent(filePath, '<type>RecordPage</type>');
      assert.fileContent(filePath, '<sobjectType>Contact</sobjectType>');
    });

    it('should create a RecordPage with primary and secondary fields', () => {
      execCmd(
        'template generate flexipage --name OpportunityPage --template RecordPage --sobject Opportunity ' +
          '--primary-field Name --secondary-fields Amount,StageName,CloseDate',
        { ensureExitCode: 0 }
      );
      const filePath = path.join(session.project.dir, 'flexipages', 'OpportunityPage.flexipage-meta.xml');
      assert.file(filePath);
      assert.fileContent(filePath, '<type>RecordPage</type>');
      assert.fileContent(filePath, '<sobjectType>Opportunity</sobjectType>');
    });

    it('should create a RecordPage with detail fields', () => {
      execCmd(
        'template generate flexipage --name LeadPage --template RecordPage --sobject Lead ' +
          '--detail-fields Name,Email,Phone,Company',
        { ensureExitCode: 0 }
      );
      const filePath = path.join(session.project.dir, 'flexipages', 'LeadPage.flexipage-meta.xml');
      assert.file(filePath);
      assert.fileContent(filePath, '<type>RecordPage</type>');
    });

    it('should create a RecordPage with custom label', () => {
      execCmd(
        'template generate flexipage --name CasePage --template RecordPage --sobject Case --label "Case Details Page"',
        { ensureExitCode: 0 }
      );
      const filePath = path.join(session.project.dir, 'flexipages', 'CasePage.flexipage-meta.xml');
      assert.file(filePath);
      assert.fileContent(filePath, '<masterLabel>Case Details Page</masterLabel>');
    });
  });

  describe('AppPage creation', () => {
    it('should create an AppPage flexipage', () => {
      execCmd('template generate flexipage --name SalesDashboard --template AppPage', { ensureExitCode: 0 });
      const filePath = path.join(session.project.dir, 'flexipages', 'SalesDashboard.flexipage-meta.xml');
      assert.file(filePath);
      assert.fileContent(filePath, '<FlexiPage');
      assert.fileContent(filePath, '<type>AppPage</type>');
    });

    it('should create an AppPage with custom label and description', () => {
      execCmd(
        'template generate flexipage --name AnalyticsDashboard --template AppPage ' +
          '--label "Analytics Dashboard" --description "Dashboard for analytics"',
        { ensureExitCode: 0 }
      );
      const filePath = path.join(session.project.dir, 'flexipages', 'AnalyticsDashboard.flexipage-meta.xml');
      assert.file(filePath);
      assert.fileContent(filePath, '<masterLabel>Analytics Dashboard</masterLabel>');
    });
  });

  describe('HomePage creation', () => {
    it('should create a HomePage flexipage', () => {
      execCmd('template generate flexipage --name CustomHome --template HomePage', { ensureExitCode: 0 });
      const filePath = path.join(session.project.dir, 'flexipages', 'CustomHome.flexipage-meta.xml');
      assert.file(filePath);
      assert.fileContent(filePath, '<FlexiPage');
      assert.fileContent(filePath, '<type>HomePage</type>');
    });

    it('should create a HomePage with custom output directory', () => {
      execCmd('template generate flexipage --name SalesHome --template HomePage --output-dir pages', {
        ensureExitCode: 0,
      });
      const filePath = path.join(session.project.dir, 'pages', 'flexipages', 'SalesHome.flexipage-meta.xml');
      assert.file(filePath);
      assert.fileContent(filePath, '<type>HomePage</type>');
    });
  });

  describe('Error handling', () => {
    it('should throw error when name flag is missing', () => {
      const stderr = execCmd('template generate flexipage --template RecordPage').shellOutput.stderr;
      expect(stderr).to.contain('Missing required flag');
    });

    it('should throw error when template flag is missing', () => {
      const stderr = execCmd('template generate flexipage --name TestPage').shellOutput.stderr;
      expect(stderr).to.contain('Missing required flag');
    });

    it('should throw error when sobject is missing for RecordPage', () => {
      const stderr = execCmd('template generate flexipage --name TestPage --template RecordPage').shellOutput.stderr;
      expect(stderr).to.contain('sobject');
    });

    it('should throw error when primary-field is used with non-RecordPage template', () => {
      const stderr = execCmd('template generate flexipage --name TestPage --template AppPage --primary-field Name')
        .shellOutput.stderr;
      expect(stderr).to.contain('primary-field');
      expect(stderr).to.contain('RecordPage');
    });

    it('should throw error when secondary-fields is used with non-RecordPage template', () => {
      const stderr = execCmd('template generate flexipage --name TestPage --template HomePage --secondary-fields Name')
        .shellOutput.stderr;
      expect(stderr).to.contain('secondary-fields');
      expect(stderr).to.contain('RecordPage');
    });

    it('should throw error when too many secondary fields are provided', () => {
      const stderr = execCmd(
        'template generate flexipage --name TestPage --template RecordPage --sobject Account ' +
          '--secondary-fields F1,F2,F3,F4,F5,F6,F7,F8,F9,F10,F11,F12'
      ).shellOutput.stderr;
      expect(stderr).to.contain('Too many secondary fields');
    });
  });

  describe('Deprecated alias support', () => {
    it('should work with flexipage:generate alias', () => {
      execCmd('flexipage generate --name AliasTestPage --template AppPage', { ensureExitCode: 0 });
      const filePath = path.join(session.project.dir, 'flexipages', 'AliasTestPage.flexipage-meta.xml');
      assert.file(filePath);
    });
  });
});

/*
 * Copyright (c) 2026, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { expect } from 'chai';
import { Connection } from '@salesforce/core';
import { retrieveIframeEntries } from '../../src/utils/lightningOutIframe.js';

/** Build a fake Connection whose metadata.read returns `readResult`. */
function fakeConn(readResult: unknown): Connection {
  return {
    metadata: {
      read: () => Promise.resolve(readResult),
    },
  } as unknown as Connection;
}

describe('retrieveIframeEntries', () => {
  it('returns [] when the settings record has no entries', async () => {
    const entries = await retrieveIframeEntries(fakeConn({ fullName: 'IframeWhiteListUrlSettings' }));
    expect(entries).to.deep.equal([]);
  });

  it('normalizes a single (scalar) entry into a one-element array', async () => {
    const entries = await retrieveIframeEntries(
      fakeConn({ iframeWhiteListUrls: { url: 'https://vf.example.com', context: 'Visualforce' } })
    );
    expect(entries).to.deep.equal([{ url: 'https://vf.example.com', context: 'Visualforce' }]);
  });

  it('preserves the context of every entry across IFrame Types', async () => {
    const entries = await retrieveIframeEntries(
      fakeConn({
        iframeWhiteListUrls: [
          { url: 'https://vf.example.com', context: 'Visualforce' },
          { url: 'https://survey.example.com', context: 'Survey' },
          { url: 'https://lo.example.com', context: 'LightningOut' },
        ],
      })
    );
    expect(entries).to.deep.equal([
      { url: 'https://vf.example.com', context: 'Visualforce' },
      { url: 'https://survey.example.com', context: 'Survey' },
      { url: 'https://lo.example.com', context: 'LightningOut' },
    ]);
  });

  it('defaults a missing context to LightningOut', async () => {
    const entries = await retrieveIframeEntries(fakeConn({ iframeWhiteListUrls: { url: 'https://x.example.com' } }));
    expect(entries).to.deep.equal([{ url: 'https://x.example.com', context: 'LightningOut' }]);
  });

  it('drops entries with no url', async () => {
    const entries = await retrieveIframeEntries(
      fakeConn({
        iframeWhiteListUrls: [{ url: 'https://ok.example.com', context: 'LightningOut' }, { context: 'Visualforce' }],
      })
    );
    expect(entries).to.deep.equal([{ url: 'https://ok.example.com', context: 'LightningOut' }]);
  });

  it('handles read() returning an array of records', async () => {
    const entries = await retrieveIframeEntries(
      fakeConn([{ iframeWhiteListUrls: { url: 'https://a.example.com', context: 'LightningOut' } }])
    );
    expect(entries).to.deep.equal([{ url: 'https://a.example.com', context: 'LightningOut' }]);
  });
});

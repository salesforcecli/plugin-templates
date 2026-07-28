/*
 * Copyright (c) 2022, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import { expect } from 'chai';
import { ConfigAggregator } from '@salesforce/core';
import { getCustomTemplates } from '../../src/utils/templateCommand.js';

describe('getCustomTemplates', () => {
  it('should still return the value when set locally (with deprecation warning)', () => {
    const mockAggregator = {
      getInfo: () => ({
        value: '/some/local/path',
        isLocal: () => true,
        isGlobal: () => false,
      }),
    } as unknown as ConfigAggregator;

    expect(getCustomTemplates(mockAggregator)).to.equal('/some/local/path');
  });

  it('should return the value when set globally', () => {
    const mockAggregator = {
      getInfo: () => ({
        value: '/Users/me/.custom-templates',
        isLocal: () => false,
        isGlobal: () => true,
      }),
    } as unknown as ConfigAggregator;

    expect(getCustomTemplates(mockAggregator)).to.equal('/Users/me/.custom-templates');
  });

  it('should return undefined when config key is not set', () => {
    const mockAggregator = {
      getInfo: () => {
        throw new Error('Unknown config name');
      },
    } as unknown as ConfigAggregator;

    expect(getCustomTemplates(mockAggregator)).to.be.undefined;
  });
});

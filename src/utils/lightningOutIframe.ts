/*
 * Copyright (c) 2026, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import { Connection } from '@salesforce/core';
import { IframeWhiteListEntry } from '@salesforce/templates';

/** Metadata API full name of the singleton IframeWhiteListUrlSettings record. */
const IFRAME_SETTINGS_TYPE = 'IframeWhiteListUrlSettings';

/** Shape of one <iframeWhiteListUrls> element as returned by the Metadata API read(). */
type RawIframeUrl = {
  url?: string;
  context?: string;
};

/** Shape of the IframeWhiteListUrlSettings metadata record. */
type RawIframeSettings = {
  fullName?: string;
  iframeWhiteListUrls?: RawIframeUrl | RawIframeUrl[];
};

/**
 * Normalize the Metadata API's read() result — which returns a single object
 * for a scalar field and an array for a repeated field — into a plain array.
 */
function toArray<T>(value: T | T[] | undefined): T[] {
  if (value === undefined || value === null) {
    return [];
  }
  return Array.isArray(value) ? value : [value];
}

/**
 * Option B (retrieve-merge). Read the org's CURRENT "Trusted Domains for Inline
 * Frames" list (IframeWhiteListUrlSettings) and return every entry as a
 * {url, context} pair — across ALL IFrame Types, not just LightningOut — so the
 * generator can re-emit them verbatim and avoid wiping the org's list when the
 * REPLACE-type settings artifact is deployed.
 */
export async function retrieveIframeEntries(conn: Connection): Promise<IframeWhiteListEntry[]> {
  // `metadata.read` types the metadata type as a closed union that predates
  // IframeWhiteListUrlSettings, so cast through the generic string overload.
  const read = await conn.metadata.read(
    IFRAME_SETTINGS_TYPE as Parameters<typeof conn.metadata.read>[0],
    IFRAME_SETTINGS_TYPE
  );
  const record = (Array.isArray(read) ? read[0] : read) as RawIframeSettings | undefined;

  return toArray(record?.iframeWhiteListUrls)
    .filter((u): u is RawIframeUrl & { url: string } => typeof u?.url === 'string' && u.url.length > 0)
    .map((u) => ({
      url: u.url,
      context: typeof u.context === 'string' && u.context.length > 0 ? u.context : 'LightningOut',
    }));
}

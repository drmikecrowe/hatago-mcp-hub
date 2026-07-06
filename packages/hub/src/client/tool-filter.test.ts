/**
 * Tests for per-server tool filtering (config `tools.include` / `tools.exclude`)
 */

import { describe, it, expect } from 'vitest';
import { ServerConfigSchema } from '@himorishige/hatago-core';
import { filterToolsByName } from './registrar.js';

const tools = [{ name: 'a' }, { name: 'b' }, { name: 'c' }];

describe('filterToolsByName', () => {
  it('returns all tools when no filter is provided', () => {
    expect(filterToolsByName(tools)).toEqual(tools);
    expect(filterToolsByName(tools, {})).toEqual(tools);
  });

  it('keeps only included tools', () => {
    expect(filterToolsByName(tools, { include: ['a', 'c'] }).map((t) => t.name)).toEqual(['a', 'c']);
  });

  it('drops excluded tools', () => {
    expect(filterToolsByName(tools, { exclude: ['b'] }).map((t) => t.name)).toEqual(['a', 'c']);
  });

  it('applies exclude after include (exclude wins)', () => {
    expect(filterToolsByName(tools, { include: ['a', 'b'], exclude: ['b'] }).map((t) => t.name)).toEqual(
      ['a']
    );
  });

  it('treats empty arrays as no-op', () => {
    expect(filterToolsByName(tools, { include: [], exclude: [] })).toEqual(tools);
  });
});

describe('ServerConfig schema accepts tools filter', () => {
  it('parses include/exclude on a server', () => {
    const parsed = ServerConfigSchema.parse({
      url: 'https://example.com/mcp',
      type: 'sse',
      tools: { include: ['getJiraIssue'], exclude: ['deleteJiraIssue'] }
    });
    expect(parsed.tools).toEqual({ include: ['getJiraIssue'], exclude: ['deleteJiraIssue'] });
  });

  it('rejects unknown keys inside tools', () => {
    expect(() =>
      ServerConfigSchema.parse({
        command: 'echo',
        tools: { only: ['a'] }
      })
    ).toThrow();
  });
});

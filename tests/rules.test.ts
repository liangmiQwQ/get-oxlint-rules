import { mkdtemp, readdir } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { expect, it } from 'vite-plus/test'

import { getRulesByCategory } from '../src/index.ts'

it('lists correctness rules from the local oxlint and caches them on disk', async () => {
  const cacheDir = await mkdtemp(join(tmpdir(), 'oxlint-utils-'))

  const rules = await getRulesByCategory('correctness', { cacheDir })

  expect(rules.map(rule => `${rule.scope}/${rule.value}`)).toContain('eslint/no-debugger')
  expect(rules.every(rule => rule.category === 'correctness')).toBe(true)
  expect(await readdir(cacheDir)).toHaveLength(1)
})

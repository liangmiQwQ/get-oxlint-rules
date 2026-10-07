import { mkdir, mkdtemp, readdir, realpath, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { expect, it } from 'vite-plus/test'

import { getRules, getRulesByCategory } from '../src/index.ts'

it('lists correctness rules from the local oxlint and caches them on disk', async () => {
  const cacheDir = await mkdtemp(join(tmpdir(), 'get-oxlint-rules-'))

  const rules = await getRulesByCategory('correctness', { cacheDir })

  expect(rules.map(rule => `${rule.scope}/${rule.value}`)).toContain('eslint/no-debugger')
  expect(rules.every(rule => rule.category === 'correctness')).toBe(true)
  expect(await readdir(cacheDir)).toHaveLength(1)
})

it('falls back to the oxlint bundled by vite-plus when the project has no oxlint', async () => {
  // A project that depends on vite-plus only, so `oxlint` is unreachable from its root.
  const project = await mkdtemp(join(tmpdir(), 'get-oxlint-rules-vp-'))
  await mkdir(join(project, 'node_modules'))
  await writeFile(join(project, 'package.json'), '{}')
  await symlink(await realpath('node_modules/vite-plus'), join(project, 'node_modules/vite-plus'))
  const { versions } = await import('vite-plus/versions')

  const rules = await getRules({ cwd: project, cacheDir: join(project, '.cache') })

  expect(rules.length).toBeGreaterThan(0)
  expect(await readdir(join(project, '.cache'))).toEqual([`rules-${versions.oxlint}.json`])
})

import { mkdir, mkdtemp, readdir, realpath, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { expect, it } from 'vite-plus/test'

import { getOxlintPlugins, getRules, getRulesByCategory } from '../src/index.ts'

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

it('uses only the oxlint of the `via` package, even when the project has its own oxlint', async () => {
  // The project's own oxlint exits with an error, so using it fails the test.
  const project = await mkdtemp(join(tmpdir(), 'get-oxlint-rules-via-'))
  await mkdir(join(project, 'node_modules/oxlint'), { recursive: true })
  await writeFile(join(project, 'package.json'), '{}')
  await writeFile(
    join(project, 'node_modules/oxlint/package.json'),
    JSON.stringify({ name: 'oxlint', version: '0.0.0', bin: { oxlint: 'oxlint.js' } })
  )
  await writeFile(join(project, 'node_modules/oxlint/oxlint.js'), 'process.exit(1)')
  await symlink(await realpath('node_modules/vite-plus'), join(project, 'node_modules/vite-plus'))

  const rules = await getRules({
    cwd: project,
    via: 'vite-plus',
    cacheDir: join(project, '.cache')
  })

  expect(rules.length).toBeGreaterThan(0)
})

it('throws instead of using oxlint on PATH when the `via` package is missing', async () => {
  const cacheDir = await mkdtemp(join(tmpdir(), 'get-oxlint-rules-'))

  await expect(getRules({ via: 'not-installed', cacheDir })).rejects.toThrow(
    'Cannot find oxlint through "not-installed"'
  )
})

it('lists built-in plugins with the names used in the `plugins` config field', async () => {
  const cacheDir = await mkdtemp(join(tmpdir(), 'get-oxlint-rules-'))

  const plugins = await getOxlintPlugins({ cacheDir })

  expect(plugins).toContain('eslint')
  expect(plugins).toContain('jsx-a11y')
  expect(new Set(plugins).size).toBe(plugins.length)
})

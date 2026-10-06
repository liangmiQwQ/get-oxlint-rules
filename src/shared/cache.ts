import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'

import findCacheDirectory from 'find-cache-dir'

const memory = new Map<string, unknown>()

export interface CacheOptions {
  cwd?: string
  /** Directory for cached data. Defaults to `node_modules/.cache/oxlint-utils`. */
  cacheDir?: string
}

export async function cached<T>(
  key: string,
  options: CacheOptions,
  load: () => Promise<T>
): Promise<T> {
  if (memory.has(key)) {
    return memory.get(key) as T
  }

  const file = join(resolveCacheDir(options), `${key}.json`)
  const value = (await readJson<T>(file)) ?? (await loadAndWrite(file, load))
  memory.set(key, value)
  return value
}

function resolveCacheDir(options: CacheOptions): string {
  if (options.cacheDir) {
    return options.cacheDir
  }
  // `find-cache-dir` returns undefined without a package.json or a writable node_modules, so fall back to the OS temp dir.
  return (
    findCacheDirectory({ name: 'oxlint-utils', cwd: options.cwd }) ?? join(tmpdir(), 'oxlint-utils')
  )
}

async function readJson<T>(file: string): Promise<T | undefined> {
  try {
    return JSON.parse(await readFile(file, 'utf8')) as T
  } catch {
    return undefined
  }
}

async function loadAndWrite<T>(file: string, load: () => Promise<T>): Promise<T> {
  const value = await load()
  await mkdir(dirname(file), { recursive: true })
  await writeFile(file, JSON.stringify(value))
  return value
}

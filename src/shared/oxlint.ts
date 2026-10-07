import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'

import { x } from 'tinyexec'

export interface OxlintBinary {
  command: string
  args: string[]
  version: string
}

export interface ResolveOxlintOptions {
  /** Extra directory to resolve the `oxlint` package from, tried before this package's own location. */
  cwd?: string
  /** Path to an oxlint executable. Skips package resolution when set. */
  bin?: string
}

// Packages that depend on `oxlint` themselves, so their copy can be reached through them under pnpm's strict layout.
const HOST_PACKAGES = ['vite-plus']

export async function resolveOxlint(options: ResolveOxlintOptions = {}): Promise<OxlintBinary> {
  if (options.bin) {
    return resolveExecutable(options.bin)
  }
  // Resolving from this file finds the user's oxlint wherever the process started, as long as `oxlint` is our peer dependency.
  const bases = options.cwd ? [options.cwd, import.meta.dirname] : [import.meta.dirname]
  for (const base of bases) {
    const manifestPath = findOxlintManifest(base)
    if (manifestPath) {
      return readOxlintPackage(manifestPath)
    }
  }
  return resolveExecutable('oxlint')
}

export async function runOxlint(
  binary: Omit<OxlintBinary, 'version'>,
  args: string[]
): Promise<string> {
  // Oxlint scans the working directory for nested configs even for `--rules`, which never finishes from a large directory, so run it in an empty one.
  const cwd = await mkdtemp(join(tmpdir(), 'oxlint-utils-'))
  try {
    const result = await x(binary.command, [...binary.args, ...args], {
      throwOnError: true,
      nodeOptions: { cwd }
    })
    return result.stdout
  } finally {
    await rm(cwd, { recursive: true, force: true })
  }
}

function findOxlintManifest(base: string): string | undefined {
  const direct = resolveManifest(base, 'oxlint')
  if (direct) {
    return direct
  }
  for (const host of HOST_PACKAGES) {
    const hostManifest = resolveManifest(base, host)
    const viaHost = hostManifest && resolveManifest(dirname(hostManifest), 'oxlint')
    if (viaHost) {
      return viaHost
    }
  }
  return undefined
}

function resolveManifest(base: string, name: string): string | undefined {
  try {
    return createRequire(join(base, 'package.json')).resolve(`${name}/package.json`)
  } catch {
    return undefined
  }
}

async function readOxlintPackage(manifestPath: string): Promise<OxlintBinary> {
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8')) as {
    version: string
    bin: { oxlint: string }
  }
  // The `oxlint` npm package ships a Node wrapper, so run it with the current Node binary.
  return {
    command: process.execPath,
    args: [join(dirname(manifestPath), manifest.bin.oxlint)],
    version: manifest.version
  }
}

async function resolveExecutable(command: string): Promise<OxlintBinary> {
  const binary = { command, args: [] }
  const output = await runOxlint(binary, ['--version'])
  // `oxlint --version` prints `Version: 1.86.0`.
  return { ...binary, version: output.replace('Version:', '').trim() }
}

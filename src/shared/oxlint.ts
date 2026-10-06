import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'

import { x } from 'tinyexec'

export interface OxlintBinary {
  command: string
  args: string[]
  version: string
}

export interface ResolveOxlintOptions {
  /** Directory to resolve the `oxlint` package from. Defaults to `process.cwd()`. */
  cwd?: string
  /** Path to an oxlint executable. Skips package resolution when set. */
  bin?: string
}

export async function resolveOxlint(options: ResolveOxlintOptions = {}): Promise<OxlintBinary> {
  if (options.bin) {
    return resolveExecutable(options.bin)
  }
  const pkg = await findOxlintPackage(options.cwd ?? process.cwd())
  return pkg ?? resolveExecutable('oxlint')
}

export async function runOxlint(
  binary: Omit<OxlintBinary, 'version'>,
  args: string[]
): Promise<string> {
  const result = await x(binary.command, [...binary.args, ...args], { throwOnError: true })
  return result.stdout
}

async function findOxlintPackage(cwd: string): Promise<OxlintBinary | undefined> {
  const require = createRequire(join(cwd, 'package.json'))
  try {
    const manifestPath = require.resolve('oxlint/package.json')
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
  } catch {
    return undefined
  }
}

async function resolveExecutable(command: string): Promise<OxlintBinary> {
  const binary = { command, args: [] }
  const output = await runOxlint(binary, ['--version'])
  // `oxlint --version` prints `Version: 1.86.0`.
  return { ...binary, version: output.replace('Version:', '').trim() }
}

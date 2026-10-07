import { cached } from '../shared/cache.ts'
import type { CacheOptions } from '../shared/cache.ts'
import { resolveOxlint, runOxlint } from '../shared/oxlint.ts'
import type { ResolveOxlintOptions } from '../shared/oxlint.ts'

export type OxlintCategory =
  | 'correctness'
  | 'suspicious'
  | 'pedantic'
  | 'perf'
  | 'style'
  | 'restriction'
  | 'nursery'

/** One entry of `oxlint --rules --format json`. */
export interface OxlintRule {
  /** Plugin name, e.g. `eslint`, `typescript`, `unicorn`. */
  scope: string
  /** Rule name without plugin prefix, e.g. `no-debugger`. */
  value: string
  category: OxlintCategory
  type_aware: boolean
  fix: string
  default: boolean
  docs_url: string
}

export type GetRulesOptions = ResolveOxlintOptions & CacheOptions

export async function getRules(options: GetRulesOptions = {}): Promise<OxlintRule[]> {
  const binary = await resolveOxlint(options)
  // Rules only change between versions, so the version is enough as a cache key.
  return cached(`rules-${binary.version}`, options, async () => {
    const output = await runOxlint(binary, ['--rules', '--format', 'json'])
    return JSON.parse(output) as OxlintRule[]
  })
}

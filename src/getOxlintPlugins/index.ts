import { getRules } from '../getRules/index.ts'
import type { GetRulesOptions } from '../getRules/index.ts'

export async function getOxlintPlugins(options?: GetRulesOptions): Promise<string[]> {
  const rules = await getRules(options)
  // Rule scopes are snake_case (`jsx_a11y`), but the `plugins` config field expects kebab-case (`jsx-a11y`).
  const plugins = rules.map(rule => rule.scope.replaceAll('_', '-'))
  return [...new Set(plugins)]
}

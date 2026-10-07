import { getRules } from '../getRules/index.ts'
import type { GetRulesOptions, OxlintCategory, OxlintRule } from '../getRules/index.ts'

export async function getRulesByCategory(
  category: OxlintCategory,
  options?: GetRulesOptions
): Promise<OxlintRule[]> {
  const rules = await getRules(options)
  return rules.filter(rule => rule.category === category)
}

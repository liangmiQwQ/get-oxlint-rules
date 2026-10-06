import { expect, it } from 'vite-plus/test'

import { oxlintUtils } from '../src/index.ts'

it('reports that the utility is not implemented yet', () => {
  expect(oxlintUtils).toThrow('Not implemented yet')
})

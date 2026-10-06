# oxlint-utils

Useful utils for Oxlint.

## Usage

```ts
import { getRules, getRulesByCategory } from 'oxlint-utils'

const rules = await getRulesByCategory('correctness')
// [{ scope: 'eslint', value: 'no-debugger', category: 'correctness', ... }]

const all = await getRules()
```

The first call runs the `oxlint` binary resolved from your project (or from `PATH`). The result is cached in `node_modules/.cache/oxlint-utils`, keyed by the Oxlint version, so later calls read from disk instead.

Options:

| Option     | Description                                                                  |
| ---------- | ---------------------------------------------------------------------------- |
| `cwd`      | Directory to resolve the `oxlint` package from. Defaults to `process.cwd()`. |
| `bin`      | Path to an oxlint executable, skipping package resolution.                   |
| `cacheDir` | Directory for cached data.                                                   |

## License

[MIT](./LICENSE) License © [Liang Mi](https://github.com/liangmiQwQ) and contributors.

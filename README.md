# get-oxlint-rules

Useful utils for Oxlint.

## Usage

```ts
import { getRules, getRulesByCategory } from 'get-oxlint-rules'

const rules = await getRulesByCategory('correctness')
// [{ scope: 'eslint', value: 'no-debugger', category: 'correctness', ... }]

const all = await getRules()
```

The first call runs the `oxlint` package installed next to this one, so it works from any working directory. In a Vite+ project without a direct `oxlint` dependency, the copy bundled by `vite-plus` is used. If no package is found, `oxlint` on `PATH` is used. The result is cached in `node_modules/.cache/get-oxlint-rules`, keyed by the Oxlint version, so later calls read from disk instead.

Options:

| Option     | Description                                                      |
| ---------- | ---------------------------------------------------------------- |
| `cwd`      | Extra directory to resolve `oxlint` (or `vite-plus`) from first. |
| `bin`      | Path to an oxlint executable, skipping package resolution.       |
| `cacheDir` | Directory for cached data.                                       |

## License

[MIT](./LICENSE) License © [Liang Mi](https://github.com/liangmiQwQ) and contributors.

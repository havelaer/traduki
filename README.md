# Traduki

[![npm](https://img.shields.io/npm/v/@traduki/runtime.svg)](https://www.npmjs.com/package/@traduki/runtime) [![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/havelaer/traduki/blob/master/LICENSE)

Traduki is a set of build- and runtime tools for lazy loading L10n messages.

* *Modular* messages files which are bundled and precompiled *per locale* and *per chunk* for production.

* When importing the messages YAML from a JS Module, it exports an object with all mappings from local message keys to global message keys. And as side effect it registers the location of the bundled (global) messages file for each locale. (Inspired by CSS Modules)

* It uses [MessageFormat](https://www.npmjs.com/package/messageformat) for text formatting.

## Packages

- [Webpack plugin and loader](https://github.com/havelaer/traduki/blob/master/packages/webpack-plugin/README.md)
- [Vite plugin](https://github.com/havelaer/traduki/blob/master/packages/vite-plugin/README.md)
- [Rollup plugin](https://github.com/havelaer/traduki/blob/master/packages/rollup-plugin/README.md)
- [React hooks and helpers](https://github.com/havelaer/traduki/blob/master/packages/react/README.md)

## Example

```yaml
# a.messages.yaml
en:
    hello: Hello {name}!
    intro: How are you?
nl:
    hello: Hallo {name}!
    intro: Hoe is het met jou?
```

```js
// index.js
import traduki from '@traduki/runtime'
import messages from './a.messages.yaml'

console.log(messages); // { hello: 'hello_30ebe736', intro: 'intro_01b95038' }

traduki.setLocale('en').load().then(() => {
    traduki.translate(messages.hello, { name: 'John' }); // "Hello John!"
});
```

## Status (in alpha)

|   |Webpack plugin|Vite plugin|
|---|---|---|
|Precompiled translations| ✅ | ✅ |
|Code splitting *| ✅ | ✅ |
|Lazy loading **| ✅ | ✅ |
|HMR| ⌛ | ✅ |
|Minify bundles| ⌛ | ⌛ |
|Strict mode ***| ⌛ | ⌛ |
|Emit .d.ts| ⌛ | ⌛ |

(*) messages bundles per locale and per chunk

(**) Lazy loading with EcmaScript Modules using the runtime

(***) Check *.messages.yaml consistency
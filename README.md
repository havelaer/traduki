# Traduki

[![npm version](https://badge.fury.io/js/%40traduki%2Fruntime.svg)](https://badge.fury.io/js/%40traduki%2Fruntime) [![Build Status](https://travis-ci.com/havelaer/traduki.svg?branch=master)](https://travis-ci.com/havelaer/traduki) [![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/havelaer/traduki/blob/master/LICENSE)

Traduki is a set of build- and runtime tools for lazy loading L10n messages.

* *Modular* messages files which are bundled and precompiled *per locale* and *per chunk* for production.

* When importing the messages YAML from a JS Module, it exports an object with all mappings from local message keys to global message keys. And as side effect it registers the location of the bundled (global) messages file for each locale. (Inspired by CSS Modules)

* It uses [MessageFormat](https://www.npmjs.com/package/messageformat) for text formatting.

## Packages

- [Webpack plugin and loader](https://github.com/havelaer/traduki/blob/master/packages/webpack-plugin/README.md)
- [Vite plugin](https://github.com/havelaer/traduki/blob/master/packages/vite-plugin/README.md)
- [Rollup plugin](https://github.com/havelaer/traduki/blob/master/packages/rollup-plugin/README.md)
- [React hooks and helpers](https://github.com/havelaer/traduki/blob/master/packages/react/README.md)

## Vanilla example

```yaml
# a.messages.yaml
en:
    hello: Hello {name}!
    intro: How are you?
nl:
    hello: Hoi {name}!
    intro: Hoe is het met jou?
```

```js
// index.js
import traduki from '@traduki/runtime'
import messages from './a.messages.yaml'

console.log(messages); // { hello: 'hello_30ebe736', intro: 'intro_01b95038' }

traduki.switchTo('en').then(() => {
    traduki.translate(messages.hello, { name: 'John' }); // "Hello John!"
});
```

## React/Preact example

```yaml
# HelloComponent.messages.yaml
en:
    hello: Hello {name}!
nl:
    hello: Hoi {name}!
```

```jsx
// HelloComponent.jsx
import { render } from 'react-dom';
import { TradukiProvider, useTranslator } from '@traduki/react';
import messages from './HelloComponent.messages.yaml';

console.log(messages); // { hello: 'hello_30ebe736' }

function HelloComponent() {
    const t = useTranslator();

    return <h1>{t(messages.hello, { name: 'John' })}</h1>; // <h1>Hello John!</h1>
}

render(
    <TradukiProvider initialLocale="en">
        <HelloComponent />
    </TradukiProvider>,
    document.getElementById('root'),
);
```

## Status (in beta)

|   |Webpack plugin|Rollup plugin|Vite plugin|
|---|---|---|---|
|Precompiled translations| ✅ | ✅ | ✅ |
|Code splitting| ✅ | ✅ | ✅ |
|Lazy loading| ✅ | ✅ | ✅ |
|Minify bundles| ✅ | ✅ | ✅ |
|Split strategy (1)| ⌛ | ✅ | ✅ |
|Strict mode (2)| ✅ | ✅ | ✅ |
|Debug warnings (3)| ✅ | ✅ | ✅ |

(1) Determine how you want to split the messages bundles:

    * per locale and per chunk
    * per locale (per entry)
    * no splitting (so no lazy loading)

    For webpack the default 'chunk' strategy is used.

(2) Check *.messages.yaml consistency

(3) Helpful warnings when

    * Using non-existing messages.<key>.
    * Messages *.messages.yaml is inconsistent.
    * Duplicate bundled runtime.
    * calling translate before messages are loaded (should not happen)
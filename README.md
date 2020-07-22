# Lazy Lion

[![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/havelaer/lazy-lion/blob/master/LICENSE) [![version](https://img.shields.io/badge/version-0.2.2-blue)](https://www.npmjs.com/package/@lazy-lion/runtime)

**⚠️ WORK IN PROGRESS ⚠**

Lazy Lion is a set of build- and runtime tools for lazy loading L10n messages.

* *Modular* messages files which are bundled and precompiled *per locale* and *per chunk* for production.

* When importing the messages YAML from a JS Module, it exports an object with all mappings from local message keys to global message keys. And as side effect it registers the location of the bundled (global) messages file for each locale.

* It uses [MessageFormat](https://www.npmjs.com/package/messageformat) for text formatting.

* The tooling is build for web applications using [Rollup](https://rollupjs.org/guide/en/) (see: [@lazy-lion/rollup-plugin](#@lazy-lion/rollup-plugin)) or [Vite](https://github.com/vitejs/vite) (see: [@lazy-lion/vite-plugin](#@lazy-lion/vite-plugin)).

* React hooks are also available (see: [@lazy-lion/react](#@lazy-lion/react))

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
import llr from '@lazy-lion/runtime'
import messages from 'a.messages.yaml'

console.log(messages); // { hello: 'hello_30ebe736', intro: 'intro_01b95038' }

(async () => {
    await llr.setLocale('en').load();

    llr.translate(messages.hello, { name: 'John' }); // "Hello John!"
})();
```

## @lazy-lion/vite-plugin

### Install

```bash
npm install --save-dev @lazy-lion/vite-plugin
npm install @lazy-lion/runtime
```

### Usage

Create a vite.config.ts configuration file and import the plugin:

```ts
// vite.config.ts
import type { UserConfig } from 'vite';
import lazyLionPlugin from '@lazy-lion/vite-plugin';

export default: UserConfig = {
    jsx: 'react',
    plugins: [lazyLionPlugin()],
};
```

### Options

TODO

## @lazy-lion/rollup-plugin

### Install

```bash
npm install --save-dev @lazy-lion/rollup-plugin
npm install @lazy-lion/runtime
```

### Usage

Create a rollup.config.js configuration file and import the plugin:

```js
// rollup.config.js
import lazyLionPlugin from '@lazy-lion/rollup-plugin';

export default {
    input: 'src/index.js',
    output: {
        dir: 'output',
        format: 'cjs',
    },
    plugins: [lazyLionPlugin()],
};
```

### Options

TODO

## @lazy-lion/react

### Install

```bash
# For Rollup:
npm install --save-dev @lazy-lion/rollup-plugin
npm install @lazy-lion/react

# Or for vite:
npm install --save-dev @lazy-lion/vite-plugin
npm install @lazy-lion/react
```

### Usage

Make sure to wrap you application in the `LazyLionProvider`:

```js
import React from 'react';
import ReactDOM from 'react-dom';
import { LazyLionProvider } from '@lazy-lion/react';
import App from './App';

ReactDOM.render(
    <LazyLionProvider initialLocale="en">
        <App />
    </LazyLionProvider>
    document.getElementById('root'),
);
```

Then you can use the `useTranslations` and `useLocale` hooks like in the example code below:

```js
import React from 'react';
import { useTranslations, useLocale } from '@lazy-lion/react';
import messages from './App.messages.yaml';

function Component() {
    const t = useTranslations();
    const [, setLocale] = useLocale();

    return (
        <div>
            <p>{t(messages.welcome)}</p>
            <p>
                <button onClick={() => setLocale('en')}>en</button>
                <button onClick={() => setLocale('nl')}>nl</button>
            </p>
        </div>
    );
}

export default App;
```

Lazy Lion is build with code splitting in mind. The react package provides a `lazy` function.

`lazy` is a wrapper around `React.lazy`: besides handling dynamic imports of components, it also takes care of the loading of the precompiled messages files associated with the chunk.

```js
import React, { Suspense } from 'react';
import { lazy } from '@lazy-lion/react';
import messages from './Component.messages.yaml';

const AsyncComponent = lazy(() => import('./AsyncComponent'));

function Component() {
    const t = useTranslations();

    return (
        <div>
            <Suspense fallback={<div>{t(messages.loading)}</div>}>
                <AsyncComponent />
            </Suspense>
        </div>
    );
}

export default Component;
```
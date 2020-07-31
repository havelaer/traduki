# Traduki

[![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/havelaer/traduki/blob/master/LICENSE) [![version](https://img.shields.io/badge/version-0.3.0-blue)](https://www.npmjs.com/package/@traduki/runtime)

**⚠️ WORK IN PROGRESS ⚠**

Traduki is a set of build- and runtime tools for lazy loading L10n messages.

* *Modular* messages files which are bundled and precompiled *per locale* and *per chunk* for production.

* When importing the messages YAML from a JS Module, it exports an object with all mappings from local message keys to global message keys. And as side effect it registers the location of the bundled (global) messages file for each locale.

* It uses [MessageFormat](https://www.npmjs.com/package/messageformat) for text formatting.

* The tooling is build for web applications using:
    - [Rollup](https://rollupjs.org/guide/en/) (see: [@traduki/rollup-plugin-traduki](#tradukirollup-plugin)), or
    - [Vite](https://github.com/vitejs/vite) (see: [@traduki/vite-plugin-traduki](#tradukivite-plugin)).
    - [Parcel (v2)](https://v2.parceljs.org/) (busy with POC).

* React hooks are also available (see: [@traduki/react](#tradukireact))

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
import messages from 'a.messages.yaml'

console.log(messages); // { hello: 'hello_30ebe736', intro: 'intro_01b95038' }

(async () => {
    await traduki.setLocale('en').load();

    traduki.translate(messages.hello, { name: 'John' }); // "Hello John!"
})();
```

## @traduki/vite-plugin-traduki

### Install

```bash
npm install --save-dev @traduki/vite-plugin-traduki
npm install @traduki/runtime
```

### Usage

Create a vite.config.ts configuration file and import the plugin:

```ts
// vite.config.ts
import type { UserConfig } from 'vite';
import tradukiPlugin from '@traduki/vite-plugin-traduki';

export default: UserConfig = {
    jsx: 'react',
    plugins: [tradukiPlugin()],
};
```

### Options

TODO

## @traduki/rollup-plugin-traduki

### Install

```bash
npm install --save-dev @traduki/rollup-plugin-traduki
npm install @traduki/runtime
```

### Usage

Create a rollup.config.js configuration file and import the plugin:

```js
// rollup.config.js
import tradukiPlugin from '@traduki/rollup-plugin-traduki';

export default {
    input: 'src/index.js',
    output: {
        dir: 'output',
        format: 'cjs',
    },
    plugins: [tradukiPlugin()],
};
```

### Options

TODO

## @traduki/react

### Install

```bash
# For Rollup:
npm install --save-dev @traduki/rollup-plugin-traduki
npm install @traduki/react

# Or for vite:
npm install --save-dev @traduki/vite-plugin-traduki
npm install @traduki/react
```

When configuring Rollup or Vite make sure you use the runtime from the react package:

```js

// ...
tradukiPlugin({
    runtimeModuleId: '@traduki/react',
}),
// ...

```
### Usage

Make sure to wrap you application in the `TradukiProvider`:

```js
import React from 'react';
import ReactDOM from 'react-dom';
import { TradukiProvider } from '@traduki/react';
import App from './App';

ReactDOM.render(
    <TradukiProvider initialLocale="en">
        <App />
    </TradukiProvider>
    document.getElementById('root'),
);
```

Then you can use the `useTranslator` and `useLocale` hooks like in the example code below:

```js
import React from 'react';
import { useTranslator, useLocale } from '@traduki/react';
import messages from './App.messages.yaml';

function Component() {
    const t = useTranslator();
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

export default Component;
```

Traduki is build with code splitting in mind. The react package provides a `lazy` function.

`lazy` is a wrapper around `React.lazy`: besides handling dynamic imports of components, it also takes care of the loading of the precompiled messages files associated with the chunk.

```js
import React, { Suspense } from 'react';
import { lazy, useTranslator } from '@traduki/react';
import messages from './Component.messages.yaml';

const AsyncComponent = lazy(() => import('./AsyncComponent'));

function Component() {
    const t = useTranslator();

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
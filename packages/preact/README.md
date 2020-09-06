# @traduki/preact

[![npm](https://img.shields.io/npm/v/@traduki/preact.svg)](https://www.npmjs.com/package/@traduki/preact)

See main github repository [readme.md](https://github.com/havelaer/traduki)

## Examples

- [Webpack example](https://github.com/havelaer/traduki/tree/master/examples/webpack-preact-app-setup)
- [Vite example](https://github.com/havelaer/traduki/tree/master/examples/vite-preact-app-setup)

## Install

- For Webpack see the: [Traduki Webpack plugin](https://github.com/havelaer/traduki/blob/master/packages/webpack-plugin/README.md)
- For Vite see the: [Traduki Vite plugin](https://github.com/havelaer/traduki/blob/master/packages/vite-plugin/README.md)

## Usage

### \<TradukiProvider />

Make sure to wrap you application in the `TradukiProvider`:

```js
import { TradukiProvider } from '@traduki/preact';
import App from './App';

render(
    <TradukiProvider initialLocale="en">
        <App />
    </TradukiProvider>
    document.getElementById('root'),
);
```

### useTranslator

Use the `useTranslator` hook to translate messages.

```js
import { useTranslator } from '@traduki/preact';
import messages from './Component.messages.yaml';

function Component() {
    const t = useTranslator();

    return (
        <div>
            <p>{t(messages.welcome)}</p>
        </div>
    );
}

export default Component;
```

### useLocale

Read the current locale or switch to another locale with the `useLocale` hook.

```js
import { useLocale } from '@traduki/preact';
import messages from './Component.messages.yaml';

function Component() {
    const [locale, setLocale] = useLocale();

    return (
        <div>
            <p>Current locale: {locale}</p>
            <p>
                <button onClick={() => setLocale('en')}>en</button>
                <button onClick={() => setLocale('nl')}>nl</button>
            </p>
        </div>
    );
}

export default Component;
```

### lazy

Traduki is build with code splitting in mind. The preact package provides a `lazy` function.

`lazy` is a wrapper around `preact/compat`'s `lazy`: besides handling dynamic imports of components, it also takes care of the loading of the precompiled messages files associated with the chunk.

```js
// AsyncComponent.js
import { useTranslator } from '@traduki/preact';
import messages from './AsyncComponent.messages.yaml';

function AsyncComponent() {
    const t = useTranslator();

    return <div>{t(messages.hello)}</div>;
}

export default Component;


// Component.js
import { lazy, useTranslator } from '@traduki/preact';
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
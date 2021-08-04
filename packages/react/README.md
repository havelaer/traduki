# @traduki/react

[![npm](https://img.shields.io/npm/v/@traduki/react.svg)](https://www.npmjs.com/package/@traduki/react)

See main github repository [readme.md](https://github.com/havelaer/traduki)

## Examples

- [Webpack example](https://github.com/havelaer/traduki/tree/master/examples/webpack-react-app-setup)
- [Vite example](https://github.com/havelaer/traduki/tree/master/examples/vite-react-app-setup)

## Install

- For Webpack see the: [Traduki Webpack plugin](https://github.com/havelaer/traduki/blob/master/packages/webpack-plugin/README.md)
- For Vite see the: [Traduki Vite plugin](https://github.com/havelaer/traduki/blob/master/packages/vite-plugin/README.md)

## Usage

### \<TradukiProvider />

Make sure to wrap you application in the `TradukiProvider`:

```js
import { TradukiProvider } from '@traduki/react';
import App from './App';

render(
    <TradukiProvider initialLocale="en">
        <App />
    </TradukiProvider>
    document.getElementById('root'),
);
```

### useTranslator

Use the `useTranslator` React hook to translate messages.

```js
import { useTranslator } from '@traduki/react';
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

Read the current locale or switch to another locale with the `useLocale` React hook.

```js
import { useLocale } from '@traduki/react';
import messages from './Component.messages.yaml';

function Component() {
    const [locale, setLocale] = useLocale();

    return (
        <div>
            <p>Current locale: {locale}</p>
            <p>
                <button onClick={() => setLocale('en-US')}>en</button>
                <button onClick={() => setLocale('nl-NL')}>nl</button>
            </p>
        </div>
    );
}

export default Component;
```

### waitForMessages

Traduki is build with code splitting in mind. The preact package provides a `waitForMessages` function.

Use `waitForMessages` when using `lazy` to make sure the chunk's messages are also loaded before rendering the chunk's component. This is prevent a flash of unlocalized texts.

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
import { lazy } from 'react';
import { waitForMessages, useTranslator } from '@traduki/react';
import messages from './Component.messages.yaml';

const AsyncComponent = lazy(() => import('./AsyncComponent').then(waitForMessages));

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
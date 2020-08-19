# @traduki/vite-plugin-traduki

[![npm](https://img.shields.io/npm/v/@traduki/vite-plugin-traduki.svg)](https://www.npmjs.com/package/@traduki/vite-plugin-traduki)

See main github repository [readme.md](https://github.com/havelaer/traduki)

## Examples

- [vite-react-example](https://github.com/havelaer/traduki/tree/master/examples/vite-react-example)

## Install

```bash
npm install --save-dev @traduki/vite-plugin-traduki
npm install @traduki/runtime # or @traduki/react if you're using React
```

## Usage

Create a vite.config.ts configuration file and import the plugin:

```ts
// vite.config.ts
import type { UserConfig } from 'vite';
import tradukiPlugin from '@traduki/vite-plugin-traduki';

export default: UserConfig = {
    jsx: 'react', // In case you're using React
    plugins: [tradukiPlugin({
        /*
         * Description: Absolute path to assets directory
         * Default: '/'
         */
        publicPath: '/_assets', // Use `/_assets`, because that is the current vite default
        /*
         * Description: Runtime module import path or name
         * Default: '@traduki/runtime'
         */
        runtimeModuleId: '@traduki/runtime', // use `@traduki/react` for React
        /*
         * Description: Hashing function for the global message keys
         * Default: ({ key, text }) => string
         */
        keyHashFn: myCustomHashFunction, // Probably won't need this, the default should be just fine
        /*
         * Description: Extension for the messages files
         * Default: '.messages.yaml'
         */
        endsWith: '.messages.yaml',
    })],
};
```
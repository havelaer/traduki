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
         * Description: Hashing function for the global message keys
         * Default: ({ key, texts[] }) => string
         * Optional
         */
        keyHashFn: myCustomHashFunction, // Probably won't need this, the default should be just fine
        /*
         * Description: Match files to be handled by Traduki
         * Default: /\.messages\.yaml$/
         * Optional
         */
        includes: /\.messages\.yaml$/,
    })],
};
```
# @traduki/rollup-plugin-traduki

[![npm](https://img.shields.io/npm/v/@traduki/rollup-plugin-traduki.svg)](https://www.npmjs.com/package/@traduki/rollup-plugin-traduki)

See main github repository [readme.md](https://github.com/havelaer/traduki)

## Install

```bash
npm install --save-dev @traduki/rollup-plugin-traduki
npm install @traduki/runtime # or @traduki/react if you're using React
```

## Usage

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
    plugins: [tradukiPlugin({
        /*
         * Description: Absolute path to assets directory
         * Default: '/'
         */
        publicPath: '/path/to/assets',
        /*
         * Description: Runtime module import path or name
         * Default: '@traduki/runtime'
         */
        runtimeModuleId: '@traduki/runtime', // use `@traduki/react` for React
        /*
         * Description: Hashing function for the global message keys
         * Default: ({ key, texts[] }) => string
         */
        keyHashFn: myCustomHashFunction, // Probably won't need this, the default should be just fine
        /*
         * Description: Match files to be handled by Traduki
         * Default: /\.messages\.yaml$/
         */
        includes: /\.messages\.yaml$/,
    })],
};
```
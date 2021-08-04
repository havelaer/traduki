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
         * Description: Hashing function for the global message keys
         * Default: ({ key, texts[] }) => string
         */
        keyHashFn: myCustomHashFunction, // Probably won't need this, the default should be just fine
        /*
         * Description: Match files to be handled by Traduki
         * Default: /\.messages\.yaml$/
         */
        includes: /\.messages\.yaml$/,
        /**
         * Description: Determine how you want to split the locales.
         * Default: 'chunk'
         *
         * 'chunk': For each entry file and chunk file,
         *          compiled messages files are generated for each locale.
         *          Used for huge size applications with lots of supported locales
         *          example output:
         *           - main.js,
         *           - main.en-us.js, (could contain messages shared between main and chunk)
         *           - main.nl-nl.js, (could contain messages shared between main and chunk)
         *           - chunk_1.js
         *           - chunk_1.en-us.js
         *           - chunk_1.nl-nl.js
         *
         * 'entry': For each entry file,
         *          compiled messages files are generated for each locale
         *          which also contain messages from chunks.
         *          Used for small/medium size applications with lots of supported locales
         *          example output:
         *           - main.js,
         *           - main.en-us.js, (also contains messages from chunks)
         *           - main.nl-nl.js, (also contains messages from chunks)
         *           - chunk_1.js
         *
         * false:   Compiled messages files are not split by locale,
         *          they are bundled with their dependent entry or chunk file.
         *          Used for small/medium size applications with 1 or 2 locales.
         *          example output:
         *           - main.js, (also bundles compiled messages files)
         *           - chunk_1.js (also bundles compiled messages files)
         */
        splitStrategy: 'chunk',
    })],
};
```
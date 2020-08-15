# @traduki/webpack-plugin-traduki

[![npm](https://img.shields.io/npm/v/@traduki/webpack-plugin-traduki.svg?maxAge=2592000)](https://www.npmjs.com/package/@traduki/webpack-plugin-traduki)

See main github repository [readme.md](https://github.com/havelaer/traduki)

## Examples

- [webpack-simple-example](https://github.com/havelaer/traduki/tree/master/examples/webpack-simple-example)
- [webpack-react-example](https://github.com/havelaer/traduki/tree/master/examples/webpack-react-example)

## Install

```bash
npm install --save-dev @traduki/webpack-plugin-traduki
npm install @traduki/runtime # or @traduki/react if you're using React
```

## Usage

Create a webpack.config.js configuration file and configure the plugin and loader:

```js
// webpack.config.js
const TradukiWebpackPlugin = require('@traduki/webpack-plugin-traduki');

module.exports = {
    // ...
    plugins: [
        new TradukiWebpackPlugin({
            /*
            * Description: File name of the precompiled messages bundles
            * Default: '[name].[locale].js'
            */
           filename: '[name].[locale].js',
            /*
            * Description: Runtime module import path or name
            * Default: '@traduki/runtime'
            */
            runtimeModuleId: '@traduki/runtime', // or @traduki/react if you're using React
        }),
    ],
    module: {
        rules: [
            // ...
            {
                test: /\.messages\.yaml$/,
                use: TradukiWebpackPlugin.loader,
            },
            // ...
        ],
    },
    // ...
};
const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const TradukiWebpackPlugin = require('@traduki/webpack-plugin-traduki');

module.exports = {
    entry: './src/main.tsx',
    mode: 'development',
    plugins: [
        new MiniCssExtractPlugin({
            // Options similar to the same options in webpackOptions.output
            // both options are optional
            filename: '[name].css',
            chunkFilename: '[id].css',
        }),
        new TradukiWebpackPlugin({
            chunkFilename: '[id].[locale].js',
            runtimeModuleId: '@traduki/react',
        }),
    ],
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: 'ts-loader',
                exclude: /node_modules/,
            },
            {
                test: /\.css$/,
                use: [
                    MiniCssExtractPlugin.loader,
                    'css-loader',
                ],
            },
            {
                test: /\.messages\.yaml$/,
                use: TradukiWebpackPlugin.loader,
            },
        ],
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.js'],
    },
    output: {
        path: path.resolve(__dirname, 'dist'),
    },
};

const path = require('path');
const TradukiWebpackPlugin = require('@traduki/webpack-plugin-traduki');

module.exports = {
    entry: './src/main.ts',
    mode: 'development',
    devtool: false,
    plugins: [
        new TradukiWebpackPlugin({
            chunkFilename: '[name].[locale].js',
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
        publicPath: '/dist/',
        chunkFilename: '[id].js',
        filename: '[name].js'
    },
};

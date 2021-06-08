const path = require('path');
const TradukiWebpackPlugin = require('@traduki/webpack-plugin-traduki');

module.exports = {
    entry: './src/main.tsx',
    plugins: [
        new TradukiWebpackPlugin({
            filename: '[name].[locale].js',
        }),
    ],
    module: {
        rules: [
            {
                test: /\.svg?$/,
                use: 'url-loader',
            },
            {
                test: /\.tsx?$/,
                use: 'ts-loader',
                exclude: /node_modules/,
            },
            {
                test: /\.css$/,
                use: ['style-loader', 'css-loader'],
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
        filename: '[name].js',
    },
};

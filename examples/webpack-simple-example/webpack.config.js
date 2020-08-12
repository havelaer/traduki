const path = require('path');
const TradukiWebpackPlugin = require('@traduki/webpack-plugin-traduki');

module.exports = {
    entry: './main.ts',
    context: path.join(__dirname, 'src'),
    devtool: false,
    plugins: [
        new TradukiWebpackPlugin({
            filename: '[name].[locale].js',
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

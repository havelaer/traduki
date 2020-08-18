import path from 'path';
import webpack from 'webpack';
import TradukiWebpackPlugin from '../../src';
import { createFsFromVolume, Volume } from 'memfs';

export default (fixture: string) => {
    const compiler = webpack({
        entry: path.resolve(__dirname, '..', fixture),
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
    });

    (compiler as any).outputFileSystem = createFsFromVolume(new Volume());
    (compiler as any).outputFileSystem.join = path.join.bind(path);

    return new Promise((resolve, reject) => {
        compiler.run((err: Error | undefined, stats: any) => {
            if (err) reject(err);
            if (stats.hasErrors()) reject(new Error(stats.toJson().errors));

            resolve(stats);
        });
    });
};

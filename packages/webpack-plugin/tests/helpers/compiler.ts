import path from 'path';
import webpack from 'webpack';
import TradukiWebpackPlugin from '../../src';
import { createFsFromVolume, fs, IFs, Volume } from 'memfs';

export type CompileResult = {
    stats: webpack.Stats;
    fs: IFs;
};

export function getAssetNames(result: CompileResult): string[] {
    return result.stats.toJson({ source: true }).assets?.map((asset: any) => asset.name) || [];
}

export async function getAssetSource(result: CompileResult, fileName: string): Promise<string> {
    return new Promise((resolve, reject) => {
        result.fs.readFile(`/public_root/${fileName}`, 'utf8', (err, content) => {
            if (err) return reject(err);

            resolve(content as string);
        });
    });
}

export default (
    fixture: string,
    pluginOptions?: any,
    configure: (config: webpack.Configuration) => webpack.Configuration = config => config,
): Promise<CompileResult> => {
    const config = {
        mode: 'production' as const,
        entry: path.resolve(__dirname, '..', fixture),
        plugins: [
            new TradukiWebpackPlugin({
                filename: '[name].[locale].js',
                ...pluginOptions,
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
            path: '/public_root',
            publicPath: '/dist/',
            chunkFilename: '[id].js',
            filename: '[name].js',
        },
    };
    const compiler = webpack(configure(config));
    const vol = new Volume();
    const fs = createFsFromVolume(vol);

    (compiler as any).outputFileSystem = fs;
    (compiler as any).outputFileSystem.join = path.join.bind(path);

    return new Promise((resolve, reject) => {
        compiler.run((err: Error | undefined, stats) => {
            if (err || !stats) {
                return reject(err);
            }

            if (stats.hasErrors()) {
                reject(new Error('Compile error'));
                return;
            }

            resolve({ stats, fs });
        });
    });
};

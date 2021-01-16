import path from 'path';
import traduki, { PluginOptions } from '../../src/index';
import { rollup, RollupOptions } from 'rollup';

export default async (
    fixture: string,
    pluginOptions: PluginOptions = {
        publicPath: '/',
    },
    configure: (config: RollupOptions) => RollupOptions = config => config,
) => {
    const config: RollupOptions = {
        input: path.resolve(__dirname, '..', fixture),
        preserveEntrySignatures: 'allow-extension',
        output: {
            dir: '../test/output',
            format: 'cjs',
            entryFileNames: `[name].js`,
            chunkFileNames: `chunks/[name].js`,
            assetFileNames: `assets/[name].js`,
        },
        external: ['@traduki/runtime'],
        plugins: [
            traduki(pluginOptions),
        ],
    };

    const bundle = await rollup(configure(config));
    const { output } = await bundle.generate(config.output as any);

    return output;
};
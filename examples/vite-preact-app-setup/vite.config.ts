import alias from '@rollup/plugin-alias';
import tradukiPlugin from '@traduki/vite-plugin-traduki';
// @ts-ignore
import prefresh from '@prefresh/vite';
import type { UserConfig } from 'vite';

const config: UserConfig = {
    jsx: {
        factory: 'h',
        fragment: 'Fragment',
    },
    assetsDir: '_assets',
    plugins: [
        alias({
            entries: [
                { find: 'react', replacement: 'preact/compat' },
                { find: 'react-dom', replacement: 'preact/compat' },
                { find: '@traduki/react', replacement: '@traduki/preact' },
            ],
        }),
        prefresh,
        tradukiPlugin({
            publicPath: '/_assets',
            runtimeModuleId: '@traduki/preact',
        }),
    ],
};

export default config;

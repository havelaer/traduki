import * as reactPlugin from 'vite-plugin-react';
import alias from '@rollup/plugin-alias';
import tradukiPlugin from '@traduki/vite-plugin-traduki';
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
            ],
        }),
        reactPlugin,
        tradukiPlugin({
            publicPath: '/_assets',
            runtimeModuleId: '@traduki/react',
        }),
    ],
};

export default config;

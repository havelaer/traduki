import * as reactPlugin from 'vite-plugin-react';
import tradukiPlugin from '@traduki/vite-plugin-traduki';
import type { UserConfig } from 'vite';

const config: UserConfig = {
    jsx: {
        factory: 'h',
        fragment: 'Fragment'
    },
    assetsDir: '_assets',
    plugins: [
        reactPlugin,
        tradukiPlugin({
            publicPath: '/_assets',
            runtimeModuleId: '@traduki/react',
        }),
    ],
};

export default config;

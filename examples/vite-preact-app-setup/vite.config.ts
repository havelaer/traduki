import tradukiPlugin from '@traduki/vite-plugin-traduki';
import prefresh from '@prefresh/vite';
import type { UserConfig } from 'vite';

const config: UserConfig = {
    esbuild: {
        jsxFactory: 'h',
        jsxFragment: 'Fragment',
    },
    plugins: [
        prefresh(),
        tradukiPlugin({
            runtimeModuleId: '@traduki/preact',
        }),
    ],
};

export default config;

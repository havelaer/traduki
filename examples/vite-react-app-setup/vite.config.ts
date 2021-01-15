import reactPlugin from '@vitejs/plugin-react-refresh';
import tradukiPlugin from '@traduki/vite-plugin-traduki';
import type { UserConfig } from 'vite';

const config: UserConfig = {
    clearScreen: false,
    esbuild: {
        jsxFactory: 'h',
        jsxFragment: 'Fragment',
    },
    plugins: [
        reactPlugin(),
        tradukiPlugin({
            runtimeModuleId: '@traduki/react',
        }),
    ],
};

export default config;

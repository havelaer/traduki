import * as reactPlugin from 'vite-plugin-react';
import tradukiPlugin from '@traduki/vite-plugin-traduki';
import type { UserConfig } from 'vite';

const config: UserConfig = {
    jsx: 'react',
    plugins: [reactPlugin, tradukiPlugin()],
};

export default config;

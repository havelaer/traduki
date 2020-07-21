import * as reactPlugin from 'vite-plugin-react';
import lazyLionPlugin from '@lazy-lion/vite-plugin';
import type { UserConfig } from 'vite';

const config: UserConfig = {
    jsx: 'react',
    plugins: [reactPlugin, lazyLionPlugin({})],
};

export default config;

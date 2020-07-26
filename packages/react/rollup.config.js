import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import pkg from './package.json';

const external = ['react'];

export default {
    input: 'src/index.tsx',
    plugins: [resolve(), commonjs(), typescript({ jsx: 'react' })],
    external,
    output: {
        file: pkg.browser,
        format: 'umd',
        name: 'TradukiReact',
        globals: {
            react: 'React',
        }
    },
};

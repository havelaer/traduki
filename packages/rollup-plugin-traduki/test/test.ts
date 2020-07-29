import { rollup, RollupOptions } from 'rollup';
import traduki from '../src/index';

const config: RollupOptions = {
    input: './test/fixtures/index.js',
    output: {
        dir: './test/output',
        format: 'cjs',
        entryFileNames: `[name].js`,
        chunkFileNames: `[name]-chunk.[hash].js`,
        assetFileNames: `assets/[name]-asset.[hash].js`,
    },
    plugins: [traduki({
        runtimeModuleId: './runtime'
    })],
};

describe('plugin', () => {
    it('should pass', async () => {
        const bundle = await rollup(config);
        await bundle.write(config.output as any);

        const output = require('./output/index.js');

        const translation = await output.index('nl');

        expect(translation.hello).toBe('Hallo John!');
        expect(translation.count).toBe('Dit heeft 4 gebruikers.');
        expect(translation.coverage).toBe('We hebben 81% code dekking.');
        expect(translation.async).toBe('Voorbeeld');
    });
});

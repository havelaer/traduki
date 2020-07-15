import { rollup, RollupOptions } from 'rollup';
import { messageformatModules } from '../src/index';

const config: RollupOptions = {
    input: './test/fixtures/index.js',
    // preserveEntrySignatures: 'allow-extension',
    output: {
        dir: './test/output',
        format: 'cjs',
        entryFileNames: `[name].js`,
        chunkFileNames: `[name]-chunk.[hash].js`,
        assetFileNames: `assets/[name]-asset.[hash].js`,
    },
    plugins: [messageformatModules({
        runtimeModuleId: './runtime'
    })],
};

describe('plugin', () => {
    it('should pass', async () => {
        const bundle = await rollup(config);
        await bundle.write(config.output as any);

        const output = require('./output/index.js');

        const translation = await output('nl');

        expect(translation.hello).toBe('Hallo John!');
        expect(translation.count).toBe('Dit heeft 4 gebruikers.');
        expect(translation.coverage).toBe('We hebben 81% code dekking.');
        expect(await translation.async).toBe('Voorbeeld');
    });
});

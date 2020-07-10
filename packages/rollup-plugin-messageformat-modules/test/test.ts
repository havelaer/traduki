import { rollup, RollupOptions } from 'rollup';
import { messageformatModules } from '../src/index';

const config: RollupOptions = {
    input: './test/fixtures/index.js',
    output: {
        file: './test/output/bundle.js',
        format: 'es',
        entryFileNames: `[name].js`,
        chunkFileNames: `[name]-chunk.js`,
    },
    plugins: [messageformatModules({
        supported: ['en', 'nl']
    })],
};

describe('plugin', () => {
    it('should pass', async () => {
        const bundle = await rollup(config);
        await bundle.write(config.output as any);

        expect(true).toBe(true);
    });
});

/**
 * @jest-environment node
 */
import compiler from './helpers/compiler';

describe('simple case', () => {
    let stats: any;

    beforeAll(async () => {
        stats = await compiler('fixtures/simple/main.js');
    });

    it('should return 3 assets', async () => {
        const assets = stats.compilation.assets;
        expect(Object.keys(assets).length).toBe(3);
        expect(assets).toHaveProperty(['main.js']);
        expect(assets).toHaveProperty(['main.nl.js']);
        expect(assets).toHaveProperty(['main.en.js']);
    });

    it('should have references to the messages bundles in main.js', async () => {
        const source = stats.compilation.assets['main.js'].source();
        expect(source).toContain('/dist/main.nl.js');
        expect(source).toContain('/dist/main.en.js');
    });

    it('should output nl messages bundle with "Dit is een test"', async () => {
        const source = stats.compilation.assets['main.nl.js'].source();
        expect(source).toContain('key1_');
        expect(source).toContain('Dit is een test');
    });

    it('should output en messages bundle with "This is a test"', async () => {
        const source = stats.compilation.assets['main.en.js'].source();
        expect(source).toContain('key1_');
        expect(source).toContain('This is a test');
    });
});

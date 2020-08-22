/**
 * @jest-environment node
 */
import compiler from './helpers/compiler';

describe('simple case', () => {
    let stats: any;

    describe('production', () => {
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

        it('should output main bundle with references to messages', async () => {
            const source = stats.compilation.assets['main.js'].source();
            expect(source).toContain('/dist/main.nl.js');
            expect(source).toContain('/dist/main.en.js');
        });

        it('should output *nl* messages bundle with "Dit is een test"', async () => {
            const source = stats.compilation.assets['main.nl.js'].source();
            expect(source).toContain('key1_');
            expect(source).toContain('Dit is een test');
        });

        it('should output *nl* messages bundle which is minified', async () => {
            const source = stats.compilation.assets['main.nl.js'].source();
            var newLines = (source.match(/\n/g) || []).length;
            expect(newLines).toBeLessThanOrEqual(1);
        });

        it('should output *en* messages bundle with "This is a test"', async () => {
            const source = stats.compilation.assets['main.en.js'].source();
            expect(source).toContain('key1_');
            expect(source).toContain('This is a test');
        });
    });

    describe('development', () => {
        beforeAll(async () => {
            stats = await compiler('fixtures/simple/main.js', {}, config => ({
                ...config,
                mode: 'development',
            }));
        });

        it('should return 3 assets', async () => {
            const assets = stats.compilation.assets;
            expect(Object.keys(assets).length).toBe(3);
            expect(assets).toHaveProperty(['main.js']);
            expect(assets).toHaveProperty(['main.nl.js']);
            expect(assets).toHaveProperty(['main.en.js']);
        });

        it('should output main bundle with references to messages', async () => {
            const source = stats.compilation.assets['main.js'].source();
            expect(source).toContain('/dist/main.nl.js');
            expect(source).toContain('/dist/main.en.js');
        });

        it('should output *nl* messages bundle with "Dit is een test"', async () => {
            const source = stats.compilation.assets['main.nl.js'].source();
            expect(source).toContain('key1_');
            expect(source).toContain('Dit is een test');
        });

        it('should output *nl* messages bundle which is *not* minified', async () => {
            const source = stats.compilation.assets['main.nl.js'].source();
            var newLines = (source.match(/\n/g) || []).length;
            expect(newLines).toBeGreaterThanOrEqual(3);
        });

        it('should output *en* messages bundle with "This is a test"', async () => {
            const source = stats.compilation.assets['main.en.js'].source();
            expect(source).toContain('key1_');
            expect(source).toContain('This is a test');
        });
    });
});

/**
 * @jest-environment node
 */
import compiler from './helpers/compiler';

describe('chunks case', () => {
    let stats: any;

    beforeAll(async () => {
        stats = await compiler('fixtures/chunks/main.js');
    });

    afterAll(() => {
        stats = null;
    });

    it('should return a main bundle (+2 messages bundles) and a chunk (+2 messages bundles)', async () => {
        const assets = stats.compilation.assets;
        expect(Object.keys(assets).length).toBe(6);
        expect(assets).toHaveProperty(['main.js']);
        expect(assets).toHaveProperty(['main.nl.js']);
        expect(assets).toHaveProperty(['main.en.js']);
        expect(assets).toHaveProperty(['1.js']);
        expect(assets).toHaveProperty(['1.en.js']);
        expect(assets).toHaveProperty(['1.en.js']);
    });

    it('should output main bundle with references to messages', async () => {
        const source = stats.compilation.assets['main.js'].source();
        expect(source).toContain('/dist/main.nl.js');
        expect(source).toContain('/dist/main.en.js');
    });

    it('should output main bundle`s *nl* messages with used keys', async () => {
        const source = stats.compilation.assets['main.en.js'].source();
        ['keyA1_', 'keyA2_', 'keyB1_', 'keyB2_', 'keyCommon1_', 'keyCommon2_'].forEach(key =>
            expect(source).toContain(key),
        );
    });

    it('should output main bundle`s *en* messages with used keys', async () => {
        const source = stats.compilation.assets['main.nl.js'].source();
        ['keyA1_', 'keyA2_', 'keyB1_', 'keyB2_', 'keyCommon1_', 'keyCommon2_'].forEach(key =>
            expect(source).toContain(key),
        );
    });

    it('should output chunk with references to messages', async () => {
        const source = stats.compilation.assets['1.js'].source();
        expect(source).toContain('/dist/1.nl.js');
        expect(source).toContain('/dist/1.en.js');
    });

    it('should output chunk`s *nl* messages with used keys', async () => {
        const source = stats.compilation.assets['1.nl.js'].source();
        ['keyC1_', 'keyC2_'].forEach(key =>
            expect(source).toContain(key),
        );
    });

    it('should output chunk`s *en* messages with used keys', async () => {
        const source = stats.compilation.assets['1.en.js'].source();
        ['keyC1_', 'keyC2_'].forEach(key =>
            expect(source).toContain(key),
        );
    });

    it('should output chunk`s *nl* messages without common messages', async () => {
        const source = stats.compilation.assets['1.nl.js'].source();
        ['keyCommon1_', 'keyCommon2_'].forEach(key =>
            expect(source).not.toContain(key),
        );
    });

    it('should output chunk`s *en* messages without common messages', async () => {
        const source = stats.compilation.assets['1.nl.js'].source();
        ['keyCommon1_', 'keyCommon2_'].forEach(key =>
            expect(source).not.toContain(key),
        );
    });
});

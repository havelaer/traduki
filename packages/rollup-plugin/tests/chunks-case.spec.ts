/**
 * @jest-environment node
 */
import compiler from './helpers/compiler';
import { getFileNames, getChunk, getAsset } from './helpers/misc';

describe('chunks case', () => {
    let output: any;

    beforeAll(async () => {
        output = await compiler('fixtures/chunks/main.js');
    });

    afterAll(() => {
        output = null;
    });

    it('should return a main bundle (+2 messages bundles) and a chunk (+2 messages bundles)', async () => {
        const assets = getFileNames(output);
        expect(assets.length).toBe(6);
        expect(assets).toContain('main.js');
        expect(assets).toContain('assets/main.nl.js');
        expect(assets).toContain('assets/main.en.js');
        expect(assets).toContain('chunks/other.js');
        expect(assets).toContain('assets/other.en.js');
        expect(assets).toContain('assets/other.en.js');
    });

    it('should output main bundle with references to messages', async () => {
        const source = getChunk(output, 'main.js')?.code;
        expect(source).toContain('/assets/main.nl.js');
        expect(source).toContain('/assets/main.en.js');
    });

    it('should output main bundle`s *nl* messages with used keys', async () => {
        const source = getAsset(output, 'assets/main.nl.js')?.source;
        ['keyA1_', 'keyA2_', 'keyB1_', 'keyB2_', 'keyCommon1_', 'keyCommon2_'].forEach(key =>
            expect(source).toContain(key),
        );
    });

    it('should output main bundle`s *en* messages with used keys', async () => {
        const source = getAsset(output, 'assets/main.en.js')?.source;
        ['keyA1_', 'keyA2_', 'keyB1_', 'keyB2_', 'keyCommon1_', 'keyCommon2_'].forEach(key =>
            expect(source).toContain(key),
        );
    });

    it('should output chunk with references to messages', async () => {
        const source = getChunk(output, 'chunks/other.js')?.code;
        expect(source).toContain('/assets/other.nl.js');
        expect(source).toContain('/assets/other.en.js');
    });

    it('should output chunk`s *nl* messages with used keys', async () => {
        const source = getAsset(output, 'assets/other.nl.js')?.source;
        ['keyC1_', 'keyC2_'].forEach(key =>
            expect(source).toContain(key),
        );
    });

    it('should output chunk`s *en* messages with used keys', async () => {
        const source = getAsset(output, 'assets/other.en.js')?.source;
        ['keyC1_', 'keyC2_'].forEach(key =>
            expect(source).toContain(key),
        );
    });

    it('should output chunk`s *nl* messages without common messages', async () => {
        const source = getAsset(output, 'assets/other.nl.js')?.source;
        ['keyCommon1_', 'keyCommon2_'].forEach(key =>
            expect(source).not.toContain(key),
        );
    });

    it('should output chunk`s *en* messages without common messages', async () => {
        const source = getAsset(output, 'assets/other.en.js')?.source;
        ['keyCommon1_', 'keyCommon2_'].forEach(key =>
            expect(source).not.toContain(key),
        );
    });
});

/**
 * @jest-environment node
 */
import compiler, { getAssetNames, getAssetSource } from './helpers/compiler';

describe('chunks case', () => {
    let result: any;

    beforeAll(async () => {
        result = await compiler('fixtures/chunks/main.js');
    });

    it('should return a main bundle (+2 messages bundles) and a chunk (+2 messages bundles)', () => {
        const assets = getAssetNames(result);
        expect(assets.length).toBe(6);
        expect(assets).toContain('main.js');
        expect(assets).toContain('main.nl.js');
        expect(assets).toContain('main.en.js');
        expect(assets).toContain('866.js');
        expect(assets).toContain('866.en.js');
        expect(assets).toContain('866.en.js');
    });

    it('should output main bundle with references to messages', async () => {
        const source = await getAssetSource(result, 'main.js');
        expect(source).toContain('/dist/main.nl.js');
        expect(source).toContain('/dist/main.en.js');
    });

    it('should output main bundle`s *nl* messages with used keys', async () => {
        const source = await getAssetSource(result, 'main.nl.js');
        ['keyA1_', 'keyA2_', 'keyB1_', 'keyB2_', 'keyCommon1_', 'keyCommon2_'].forEach(key =>
            expect(source).toContain(key),
        );
    });

    it('should output main bundle`s *en* messages with used keys', async () => {
        const source = await getAssetSource(result, 'main.en.js');
        ['keyA1_', 'keyA2_', 'keyB1_', 'keyB2_', 'keyCommon1_', 'keyCommon2_'].forEach(key =>
            expect(source).toContain(key),
        );
    });

    it('should output chunk with references to messages', async () => {
        const source = await getAssetSource(result, '866.js');
        expect(source).toContain('/dist/866.nl.js');
        expect(source).toContain('/dist/866.en.js');
    });

    it('should output chunk`s *nl* messages with used keys', async () => {
        const source = await getAssetSource(result, '866.nl.js');
        ['keyC1_', 'keyC2_'].forEach(key => expect(source).toContain(key));
    });

    it('should output chunk`s *en* messages with used keys', async () => {
        const source = await getAssetSource(result, '866.en.js');
        ['keyC1_', 'keyC2_'].forEach(key => expect(source).toContain(key));
    });

    it('should output chunk`s *nl* messages without common messages', async () => {
        const source = await getAssetSource(result, '866.nl.js');
        ['keyCommon1_', 'keyCommon2_'].forEach(key => expect(source).not.toContain(key));
    });

    it('should output chunk`s *en* messages without common messages', async () => {
        const source = await getAssetSource(result, '866.en.js');
        ['keyCommon1_', 'keyCommon2_'].forEach(key => expect(source).not.toContain(key));
    });
});

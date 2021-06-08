/**
 * @jest-environment node
 */
import compiler, { CompileResult, getAssetNames, getAssetSource } from './helpers/compiler';

describe('simple case', () => {
    let result: CompileResult;

    describe('production', () => {
        beforeAll(async () => {
            result = await compiler('fixtures/simple/main.js');
        });

        it('should return 3 assets', async () => {
            const assets = getAssetNames(result);
            expect(assets.length).toBe(3);
            expect(assets).toContain('main.js');
            expect(assets).toContain('main.nl.js');
            expect(assets).toContain('main.en.js');
        });

        it('should output main bundle with references to messages', async () => {
            const source = await getAssetSource(result, 'main.js');
            expect(source).toContain('/dist/main.nl.js');
            expect(source).toContain('/dist/main.en.js');
        });

        it('should output *nl* messages bundle with "Dit is een test"', async () => {
            const source = await getAssetSource(result, 'main.nl.js');
            expect(source).toContain('key1_');
            expect(source).toContain('Dit is een test');
        });

        it('should output *nl* messages bundle which is minified', async () => {
            const source = await getAssetSource(result, 'main.nl.js');
            var newLines = (source.match(/\n/g) || []).length;
            expect(newLines).toBeLessThanOrEqual(1);
        });

        it('should output *en* messages bundle with "This is a test"', async () => {
            const source = await getAssetSource(result, 'main.en.js');
            expect(source).toContain('key1_');
            expect(source).toContain('This is a test');
        });
    });

    describe('development', () => {
        beforeAll(async () => {
            result = await compiler('fixtures/simple/main.js', {}, config => ({
                ...config,
                mode: 'development',
            }));
        });

        it('should return 3 assets', async () => {
            const assets = getAssetNames(result);
            expect(assets.length).toBe(3);
            expect(assets).toContain('main.js');
            expect(assets).toContain('main.nl.js');
            expect(assets).toContain('main.en.js');
        });

        it('should output main bundle with references to messages', async () => {
            const source = await getAssetSource(result, 'main.js');
            expect(source).toContain('/dist/main.nl.js');
            expect(source).toContain('/dist/main.en.js');
        });

        it('should output *nl* messages bundle with "Dit is een test"', async () => {
            const source = await getAssetSource(result, 'main.nl.js');
            expect(source).toContain('key1_');
            expect(source).toContain('Dit is een test');
        });

        it('should output *nl* messages bundle which is *not* minified', async () => {
            const source = await getAssetSource(result, 'main.nl.js');
            var newLines = (source.match(/\n/g) || []).length;
            expect(newLines).toBeGreaterThanOrEqual(3);
        });

        it('should output *en* messages bundle with "This is a test"', async () => {
            const source = await getAssetSource(result, 'main.en.js');
            expect(source).toContain('key1_');
            expect(source).toContain('This is a test');
        });
    });
});

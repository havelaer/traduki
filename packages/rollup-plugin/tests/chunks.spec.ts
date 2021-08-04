/**
 * @jest-environment node
 */
import compile from './helpers/compiler';
import { getAsset, getChunk, getFileNames } from './helpers/misc';

describe('chunks case', () => {
    let output: any;

    afterAll(() => {
        output = null;
    });

    describe('splitStrategy chunk', () => {
        beforeAll(async () => {
            output = await compile('fixtures/chunks/main.js', {
                splitStrategy: 'chunk',
            });
        });

        it('should return a main bundle (+2 messages bundles) and a chunk (+2 messages bundles)', async () => {
            const assets = getFileNames(output);
            expect(assets.length).toBe(6);
            expect(assets).toContain('main.js');
            expect(assets).toContain('assets/main.nl-nl.js');
            expect(assets).toContain('assets/main.en-us.js');
            expect(assets).toContain('chunks/other.js');
            expect(assets).toContain('assets/other.en-us.js');
            expect(assets).toContain('assets/other.en-us.js');
        });

        it('should output main bundle with references to messages', async () => {
            const source = getChunk(output, 'main.js')?.code;
            expect(source).toContain('/assets/main.nl-nl.js');
            expect(source).toContain('/assets/main.en-us.js');
        });

        it('should output main bundle`s *nl* messages with used keys', async () => {
            const source = getAsset(output, 'assets/main.nl-nl.js')?.source;
            ['keyA1_', 'keyA2_', 'keyB1_', 'keyB2_', 'keyCommon1_', 'keyCommon2_'].forEach(key =>
                expect(source).toContain(key),
            );
        });

        it('should output main bundle`s *en* messages with used keys', async () => {
            const source = getAsset(output, 'assets/main.en-us.js')?.source;
            ['keyA1_', 'keyA2_', 'keyB1_', 'keyB2_', 'keyCommon1_', 'keyCommon2_'].forEach(key =>
                expect(source).toContain(key),
            );
        });

        it('should output chunk with references to messages', async () => {
            const source = getChunk(output, 'chunks/other.js')?.code;
            expect(source).toContain('/assets/other.nl-nl.js');
            expect(source).toContain('/assets/other.en-us.js');
        });

        it('should output chunk`s *nl* messages with used keys', async () => {
            const source = getAsset(output, 'assets/other.nl-nl.js')?.source;
            ['keyC1_', 'keyC2_'].forEach(key => expect(source).toContain(key));
        });

        it('should output chunk`s *en* messages with used keys', async () => {
            const source = getAsset(output, 'assets/other.en-us.js')?.source;
            ['keyC1_', 'keyC2_'].forEach(key => expect(source).toContain(key));
        });

        it('should output chunk`s *nl* messages without common messages', async () => {
            const source = getAsset(output, 'assets/other.nl-nl.js')?.source;
            ['keyCommon1_', 'keyCommon2_'].forEach(key => expect(source).not.toContain(key));
        });

        it('should output chunk`s *en* messages without common messages', async () => {
            const source = getAsset(output, 'assets/other.en-us.js')?.source;
            ['keyCommon1_', 'keyCommon2_'].forEach(key => expect(source).not.toContain(key));
        });
    });

    describe('splitStrategy entry', () => {
        beforeAll(async () => {
            output = await compile('fixtures/chunks/main.js', {
                splitStrategy: 'entry',
            });
        });

        it('should return a main bundle (+2 messages bundles) and a chunk without messages bundles)', async () => {
            const assets = getFileNames(output);
            expect(assets.length).toBe(4);
            expect(assets).toContain('main.js');
            expect(assets).toContain('assets/main.nl-nl.js');
            expect(assets).toContain('assets/main.en-us.js');
            expect(assets).toContain('chunks/other.js');
        });

        it('should output main bundle with references to messages', async () => {
            const source = getChunk(output, 'main.js')?.code;
            expect(source).toContain('/assets/main.nl-nl.js');
            expect(source).toContain('/assets/main.en-us.js');
        });

        it('should output main bundle`s *nl* messages with ALL keys', async () => {
            const source = getAsset(output, 'assets/main.nl-nl.js')?.source;
            [
                'keyA1_',
                'keyA2_',
                'keyB1_',
                'keyB2_',
                'keyC1_',
                'keyC2_',
                'keyCommon1_',
                'keyCommon2_',
            ].forEach(key => expect(source).toContain(key));
        });

        it('should output main bundle`s *en* messages with ALL keys', async () => {
            const source = getAsset(output, 'assets/main.en-us.js')?.source;
            [
                'keyA1_',
                'keyA2_',
                'keyB1_',
                'keyB2_',
                'keyC1_',
                'keyC2_',
                'keyCommon1_',
                'keyCommon2_',
            ].forEach(key => expect(source).toContain(key));
        });

        it('should output chunk without references to messages', async () => {
            const source = getChunk(output, 'chunks/other.js')?.code;
            expect(source).not.toContain('/assets/other.nl-nl.js');
            expect(source).not.toContain('/assets/other.en-us.js');
        });
    });

    describe('splitStrategy false', () => {
        beforeAll(async () => {
            output = await compile('fixtures/chunks/main.js', {
                splitStrategy: false,
            });
        });

        it('should return a main bundle (+2 messages bundles) and a chunk without messages bundles)', async () => {
            const assets = getFileNames(output);
            expect(assets.length).toBe(2);
            expect(assets).toContain('main.js');
            expect(assets).toContain('chunks/other.js');
        });

        it('should output main bundle containing main and common compiled *nl* messages', async () => {
            const source = getChunk(output, 'main.js')?.code;
            // prettier-ignore
            [
                'keyA1_', 'Dit is keyA1',
                'keyA2_', 'Dit is keyA2',
                'keyB1_', 'Dit is keyB1',
                'keyB2_', 'Dit is keyB2',
                'keyCommon1_', 'Dit is keyCommon1',
                'keyCommon2_', 'Dit is keyCommon2',
            ].forEach(key => expect(source).toContain(key));
        });

        it('should output main bundle withou containing chunk`s compiled messages', async () => {
            const source = getChunk(output, 'main.js')?.code;
            // prettier-ignore
            [
                'keyC1_',
                'keyC2_',
            ].forEach(key => expect(source).not.toContain(key));
        });

        it('should output main bundle containing main and common compiled *en* messages', async () => {
            const source = getChunk(output, 'main.js')?.code;
            // prettier-ignore
            [
                'keyA1_', 'This is keyA1',
                'keyA2_', 'This is keyA2',
                'keyB1_', 'This is keyB1',
                'keyB2_', 'This is keyB2',
                'keyCommon1_', 'This is keyCommon1',
                'keyCommon2_', 'This is keyCommon2',
            ].forEach(key => expect(source).toContain(key));
        });

        it('should output chunk bundle containing chunk`s compiled *nl* messages', async () => {
            const source = getChunk(output, 'chunks/other.js')?.code;
            // prettier-ignore
            [
                'keyC1_', 'Dit is keyC1',
                'keyC2_', 'Dit is keyC2',
            ].forEach(key => expect(source).toContain(key));
        });

        it('should output chunk bundle without containing main or shared compiled messages', async () => {
            const source = getChunk(output, 'chunks/other.js')?.code;
            [
                'keyA1_',
                'keyA2_',
                'keyB1_',
                'keyB2_',
                'keyCommon1_',
                'keyCommon2_'
            ].forEach(key => expect(source).not.toContain(key));
        });

        it('should output chunk bundle containing chunk`s compiled *en* messages', async () => {
            const source = getChunk(output, 'chunks/other.js')?.code;
            // prettier-ignore
            [
                'keyC1_', 'This is keyC1',
                'keyC2_', 'This is keyC2',
            ].forEach(key => expect(source).toContain(key));
        });
    });
});

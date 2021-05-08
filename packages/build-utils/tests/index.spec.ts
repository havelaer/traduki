/**
 * @jest-environment node
 */
// @ts-ignore
import nodeEval from 'node-eval';
import {
    generateExportMapping,
    generateImporters,
    generatePrecompiledMessages,
    minify,
    toMessagesMap,
    transformMessageKeys,
    assertIsConsistent,
} from '../src';

const messages = require('./fixtures/messages.json');
const messagesMap = require('./fixtures/messages-map.json');

describe('utils', () => {
    describe('toMessagesMap', () => {
        it('should create a messages map of raw messages file', () => {
            expect(toMessagesMap(messages)).toEqual(messagesMap);
        });

        it('should return different hashes when content changes', () => {
            const messagesB = {
                ...messages,
                nl: {
                    plain: 'Dit WAS een plat bericht',
                },
            };
            expect(toMessagesMap(messages).plain).not.toBe(toMessagesMap(messagesB).plain);
        });

        it('should return different hashes new locale is added', () => {
            const messagesB = {
                ...messages,
                de: {
                    plain: 'Dies ist eine einfache Botschaft',
                },
            };
            expect(toMessagesMap(messages).plain).not.toBe(toMessagesMap(messagesB).plain);
        });
    });

    describe('assertIsConsistent', () => {
        it('should be true for consistent keys', () => {
            expect(
                assertIsConsistent({
                    locale1: { a: 'a1', b: 'b1', c: 'c1' },
                    locale2: { a: 'a2', b: 'b2', c: 'c2' },
                    locale3: { a: 'a3', b: 'b3', c: 'c3' },
                }),
            ).toBe(true);
        });

        it('should be false inconsistent keys (1)', () => {
            expect(
                assertIsConsistent({
                    locale1: { a: 'a1', b: 'b1' },
                    locale2: { a: 'a2', b: 'b2', c: 'c2' },
                    locale3: { a: 'a3', b: 'b3', c: 'c3' },
                }),
            ).toBe(false);
        });

        it('should be false inconsistent keys (2)', () => {
            expect(
                assertIsConsistent({
                    locale1: { a: 'a1', b: 'b1', c: 'c1' },
                    locale2: { a: 'a2', b: 'b2' },
                    locale3: { a: 'a3', b: 'b3', c: 'c3' },
                }),
            ).toBe(false);
        });

        it('should be false inconsistent keys (3)', () => {
            expect(
                assertIsConsistent({
                    locale1: { a: 'a1', b: 'b1', c: 'c1' },
                    locale2: { a: 'a2', b: 'b2', c: 'c2' },
                    locale3: { a: 'a3', b: 'b3' },
                }),
            ).toBe(false);
        });

        it('should be false inconsistent keys (3)', () => {
            expect(
                assertIsConsistent({
                    locale1: { a: 'a1', b: 'b1', c: 'c1' },
                    locale2: { a: 'a2', b: 'b2', c: 'c2' },
                    locale3: { a: 'a3', b: 'b3', z: 'c3' }, // note the 'z'
                }),
            ).toBe(false);
        });
    });

    describe('transformMessageKeys', () => {
        it('should transform the keys from the messages object to hashed unique keys', () => {
            expect(transformMessageKeys(messages['en'], messagesMap)).toMatchSnapshot();
        });
    });

    describe('generateExportMapping', () => {
        it('should generate code for exporting messages key mapping', () => {
            const code = generateExportMapping(messages['en']);
            expect(code).toMatchSnapshot();
        });

        it('should generate code for exporting messages key mapping for commonjs', () => {
            const code = generateExportMapping(messages['en'], { format: 'cjs' });
            expect(code).toMatchSnapshot();
        });

        it('should generate debug code when debugSource is provided', () => {
            const code = generateExportMapping(messages['en'], {
                debugSource: './test.messages.yaml',
            });
            expect(code).toMatchSnapshot();
        });

        it('should generate code for exporting messages key mapping for commonjs', () => {
            const code = generateExportMapping(messages['en'], {
                format: 'cjs',
                debugSource: './test.messages.yaml',
            });
            expect(code).toMatchSnapshot();
        });
    });

    describe('generateImporters', () => {
        it('should generate code for registering importers per locale', () => {
            const registerMap = {
                en: '() => import("/path/to/en.messages.js")',
                nl: '() => import("/path/to/nl.messages.js")',
            };

            expect(generateImporters('abcdef', registerMap)).toMatchSnapshot();
        });

        it('should generate code for registering importers per locale for commonjs', () => {
            const registerMap = {
                en: '() => require("/path/to/en.messages.js")',
                nl: '() => require("/path/to/nl.messages.js")',
            };

            expect(
                generateImporters('abcdef', registerMap, {
                    format: 'cjs',
                }),
            ).toMatchSnapshot();
        });
    });

    describe('generatePrecompiledMessages', () => {
        it('should generate precompiled messages bundle code', () => {
            const code = generatePrecompiledMessages('en', messages['en']);
            expect(code).toMatchSnapshot();
        });

        it('should generate precompiled messages bundle code for commonjs', () => {
            const code = generatePrecompiledMessages('en', messages['en'], 'cjs');
            expect(code).toMatchSnapshot();
            expect(nodeEval(code).found({ results: 3 })).toBe('found 3 results');
        });
    });

    describe('minify', () => {
        it('should minify code', async () => {
            const raw = generatePrecompiledMessages('en', messages['en']);
            const minified = await minify(raw);

            expect(minified).toMatchSnapshot();
        });

        it('should still be executable (commonjs)', async () => {
            const raw = generatePrecompiledMessages('en', messages['en'], 'cjs');
            const minified = await minify(raw);

            expect(nodeEval(raw).found({ results: 3 })).toBe('found 3 results');
            expect(nodeEval(minified).found({ results: 3 })).toBe('found 3 results');
        });
    });
});

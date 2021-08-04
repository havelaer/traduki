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
    readYaml,
    toMessagesMap,
    transformMessageKeys,
    assertIsConsistent,
    toVarIdentifier,
    toPathIdentifier,
} from '../src';
import path from 'path';

const messages = require('./fixtures/messages.json');
const messagesMap = require('./fixtures/messages-map.json');

describe('utils', () => {
    describe('readYaml', () => {
        it('should read and parse yaml file', async () => {
            const messages = await readYaml(path.join(__dirname, './fixtures/a.messages.yaml'));
            expect(messages).toEqual({
                'en-US': {
                    key1: 'This is a test',
                },
                'nl-NL': {
                    key1: 'Dit is een test',
                },
            });
        });
    });

    describe('toVarIdentifier', () => {
        it('should make string a valid js variable identifier', async () => {
            expect(toVarIdentifier('nl-NL')).toBe('$nl_NL');
        });
    });

    describe('toPathIdentifier', () => {
        it('should make string a valid js variable identifier', async () => {
            expect(toPathIdentifier('nl-NL')).toBe('nl-nl');
        });
    });

    describe('toMessagesMap', () => {
        it('should create a messages map of raw messages file', () => {
            expect(toMessagesMap(messages)).toEqual(messagesMap);
        });

        it('should return different hashes when content changes', () => {
            const messagesB = {
                ...messages,
                'nl-NL': {
                    plain: 'Dit WAS een plat bericht',
                },
            };
            expect(toMessagesMap(messages).plain).not.toBe(toMessagesMap(messagesB).plain);
        });

        it('should return different hashes new locale is added', () => {
            const messagesB = {
                ...messages,
                'de-DE': {
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
            expect(transformMessageKeys(messages['en-US'], messagesMap)).toMatchSnapshot();
        });
    });

    describe('generateExportMapping', () => {
        it('should generate code for exporting messages key mapping', () => {
            const code = generateExportMapping(messages['en-US']);
            expect(code).toMatchSnapshot();
        });

        it('should generate code for exporting messages key mapping for commonjs', () => {
            const code = generateExportMapping(messages['en-US'], { format: 'cjs' });
            expect(code).toMatchSnapshot();
        });

        it('should generate debug code when debugSource is provided', () => {
            const code = generateExportMapping(messages['en-US'], {
                debugSource: './test.messages.yaml',
            });
            expect(code).toMatchSnapshot();
        });

        it('should generate code for exporting messages key mapping for commonjs', () => {
            const code = generateExportMapping(messages['en-US'], {
                format: 'cjs',
                debugSource: './test.messages.yaml',
            });
            expect(code).toMatchSnapshot();
        });
    });

    describe('generateImporters', () => {
        it('should generate code for registering importers per locale', () => {
            const registerMap = {
                'en-US': '() => import("/path/to/en-us.messages.js")',
                'nl-NL': '() => import("/path/to/nl-nl.messages.js")',
            };

            expect(generateImporters('abcdef', registerMap)).toMatchSnapshot();
        });

        it('should generate code for registering importers per locale for commonjs', () => {
            const registerMap = {
                'en-US': '() => require("/path/to/en-us.messages.js")',
                'nl-NL': '() => require("/path/to/nl-nl.messages.js")',
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
            const code = generatePrecompiledMessages('en-US', messages['en-US']);
            expect(code).toMatchSnapshot();
        });

        it('should generate precompiled messages bundle code for commonjs', () => {
            const code = generatePrecompiledMessages('en-US', messages['en-US'], 'cjs');
            expect(code).toMatchSnapshot();
            expect(nodeEval(code).found({ results: 3 })).toBe('found 3 results');
        });
    });

    describe('minify', () => {
        it('should minify code', async () => {
            const raw = generatePrecompiledMessages('en-US', messages['en-US']);
            const minified = await minify(raw);

            expect(minified).toMatchSnapshot();
        });

        it('should still be executable (commonjs)', async () => {
            const raw = generatePrecompiledMessages('en-US', messages['en-US'], 'cjs');
            const minified = await minify(raw);

            expect(nodeEval(raw).found({ results: 3 })).toBe('found 3 results');
            expect(nodeEval(minified).found({ results: 3 })).toBe('found 3 results');
        });
    });
});

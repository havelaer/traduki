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
} from '../src';

const messages = require('./fixtures/messages.json');
const messagesMap = require('./fixtures/messages-map.json');

describe('utils', () => {
    describe('toMessagesMap', () => {
        it('should create a messages map of raw messages file', () => {
            expect(toMessagesMap(messages)).toEqual(messagesMap);
        });

        it('should return different hashes for different content', () => {
            const messagesA = {
                key1: 'This is key1',
            };
            const messagesB = {
                key1: 'This is also key1, but different',
            };
            expect(toMessagesMap(messagesA).key1).not.toBe(toMessagesMap(messagesB).key1);
        });

        it('should return same hashes for same content', () => {
            const messagesA = {
                key1: 'This is key1',
            };
            const messagesB = {
                key1: 'This is key1',
            };
            expect(toMessagesMap(messagesA).key1).toBe(toMessagesMap(messagesB).key1);
        });
    });

    describe('transformMessageKeys', () => {
        it('should transform the keys from the messages object to hashed unique keys', () => {
            expect(transformMessageKeys(messages, messagesMap)).toEqual({
                plain_065d1ea0: 'This is a plain messages',
                hello_8e9460b0: 'Hello {name}',
                found_023c8d84:
                    'found {results, plural, =0 {no results} one {1 result} other {# results}}',
                camelCase_616a71fa: 'This is camelCase',
                'kebab-case_0a0024bd': 'This is kebab-case',
                snake_case_18d98646: 'This is snake_case',
            });
        });
    });

    describe('generateExportMapping', () => {
        it('should generate code for exporting messages key mapping', () => {
            expect(generateExportMapping(messages)).toMatchSnapshot();
        });

        it('should generate code for exporting messages key mapping for commonjs', () => {
            expect(generateExportMapping(messages, 'cjs')).toMatchSnapshot();
        });
    });

    describe('generateImporters', () => {
        it('should generate code for registering importers per locale', () => {
            const registerMap = {
                en: '() => import("/path/to/en.messages.js")',
                nl: '() => import("/path/to/nl.messages.js")',
            };

            expect(generateImporters(registerMap, '@traduki/runtime')).toMatchSnapshot();
        });

        it('should generate code for registering importers per locale for commonjs', () => {
            const registerMap = {
                en: '() => require("/path/to/en.messages.js")',
                nl: '() => require("/path/to/nl.messages.js")',
            };

            expect(generateImporters(registerMap, '@traduki/runtime', 'cjs')).toMatchSnapshot();
        });
    });

    describe('generatePrecompiledMessages', () => {
        it('should generate precompiled messages bundle code', () => {
            const code = generatePrecompiledMessages('en', messages);
            expect(code).toMatchSnapshot();
        });

        it('should generate precompiled messages bundle code for commonjs', () => {
            const code = generatePrecompiledMessages('en', messages, 'cjs');
            expect(code).toMatchSnapshot();
            expect(nodeEval(code).found({ results: 3 })).toBe('found 3 results');
        });
    });

    describe('minify', () => {
        it('should minify code', async () => {
            const raw = generatePrecompiledMessages('en', messages);
            const minified = await minify(raw);

            expect(minified).toMatchSnapshot();
        });

        it('should still be executable (commonjs)', async () => {
            const raw = generatePrecompiledMessages('en', messages, 'cjs');
            const minified = await minify(raw);

            expect(nodeEval(raw).found({ results: 3 })).toBe('found 3 results');
            expect(nodeEval(minified).found({ results: 3 })).toBe('found 3 results');
        });
    });
});

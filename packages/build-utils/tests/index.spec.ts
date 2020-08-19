/**
 * @jest-environment node
 */
import {
    toMessagesMap,
    transformMessageKeys,
    generateImporters,
    generateExportMapping,
    generatePrecompiledMessages,
} from '../src';

describe('utils', () => {
    describe('toMessagesMap', () => {
        it('should create a messages map of raw messages file', () => {
            const messages = {
                key1: 'This is key1',
                key2: 'This is key2',
                camelCase: 'This is camelCase',
                snake_case: 'This is snake_case',
            };
            expect(toMessagesMap(messages)).toEqual({
                camelCase: 'camelCase_616a71fa',
                key1: 'key1_df89b086',
                key2: 'key2_7218f15d',
                snake_case: 'snake_case_18d98646',
            });
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
            const messages = {
                key1: 'This is key1',
                key2: 'This is key2',
                camelCase: 'This is camelCase',
                snake_case: 'This is snake_case',
            };

            const messagesMap = {
                key1: 'key1_df89b086',
                key2: 'key2_7218f15d',
                camelCase: 'camelCase_616a71fa',
                snake_case: 'snake_case_18d98646',
            };

            expect(transformMessageKeys(messages, messagesMap)).toEqual({
                key1_df89b086: 'This is key1',
                key2_7218f15d: 'This is key2',
                camelCase_616a71fa: 'This is camelCase',
                snake_case_18d98646: 'This is snake_case',
            });
        });
    });

    describe('generateExportMapping', () => {
        it('should generate code for exporting messages key mapping', () => {
            const messages = {
                key1: 'key1_df89b086',
                key2: 'key2_7218f15d',
                camelCase: 'camelCase_616a71fa',
                snake_case: 'snake_case_18d98646',
            };

            expect(generateExportMapping(messages)).toMatchSnapshot();
        });

        it('should generate code for exporting messages key mapping for commonjs', () => {
            const messages = {
                key1: 'key1_df89b086',
                key2: 'key2_7218f15d',
                camelCase: 'camelCase_616a71fa',
                snake_case: 'snake_case_18d98646',
            };

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
            const messages = {
                key1: 'This is key1',
                hello: 'Hello {name}',
            };

            expect(generatePrecompiledMessages('en', messages)).toMatchSnapshot();
        });

        it('should generate precompiled messages bundle code for commonjs', () => {
            const messages = {
                key1: 'This is key1',
                hello: 'Hello {name}',
            };

            expect(generatePrecompiledMessages('en', messages, 'cjs')).toMatchSnapshot();
        });
    });
});

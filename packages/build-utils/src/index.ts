import fs from 'fs';
import * as Yaml from 'js-yaml';
import hash from 'hash-sum';
import MessageFormat from 'messageformat';

export type Locale = string;

export type Messages = Record<string, string>;

export type MessagesMap = Record<string, string>;

export type RegisterMap = Record<Locale, string>;

export type Dictionaries = Record<Locale, Messages>;

export type KeyHashFnArgs = { key: string; path: string; text: string };

const messagesFormatExport: Record<string, string | undefined> = {
    amd: 'module.exports',
    cjs: 'module.exports',
    es: 'export default',
    esm: 'export default',
    iife: '', // TODO
    system: '', // TODO
    umd: undefined,
};

export function defaultKeyHashFn({ key, path, text }: KeyHashFnArgs) {
    return hash(`${key}_${path}_${text}`);
}

/**
 * Creates a messages mapping object from a messages object
 * { hello: "Hello world!" } -> { hello: "hello_5nf85" }
 */
export function toMessagesMap(
    messages: Messages,
    path: string,
    keyHashFn: (data: KeyHashFnArgs) => string = defaultKeyHashFn,
): MessagesMap {
    return Object.keys(messages).reduce(
        (prev, key) => ({
            ...prev,
            [key]: `${key}_${keyHashFn({
                key,
                path,
                text: messages[key],
            })}`,
        }),
        {},
    );
}

/**
 * Parse Yaml
 */
export function parseYaml(data: string): Dictionaries {
    return Yaml.load(data);
}

/**
 * Read file and parse Yaml
 */
export function readYaml(path: string): Promise<Dictionaries> {
    return new Promise((resolve, reject) => {
        fs.readFile(path, { encoding: 'utf8' }, (err, data) => {
            if (err) {
                reject(err);
                return;
            }
            resolve(parseYaml(data));
        });
    });
}

/**
 * Transform the keys of the message object to the key names found in the messages map
 * { hello: "Hello world!" } x { hello: "hello_5nf85" } -> { hello_5nf85: "Hello world!" }
 */
export function transformMessageKeys(messages: Messages, messagesMap: MessagesMap) {
    return Object.keys(messages).reduce(
        (prev, key) => ({
            ...prev,
            [messagesMap[key]]: messages[key],
        }),
        {},
    );
}

/**
 * Generate source code that when runs: registers the location of the precompiled messages bundles
 * for each locale and exports the messages map object to be used in the application.
 */
export function generateMapping(
    messagesMap: MessagesMap,
    registerMap?: Record<Locale, string>,
    runtimeModuleId?: string,
    format: 'cjs' | 'esm' = 'esm',
): string {
    const registerMapString = registerMap
        ? Object.keys(registerMap)
              .map(locale => `\t${locale}: ${registerMap[locale]}`)
              .join(',\n')
        : '';
    const messagesMapString = JSON.stringify(messagesMap, null, 4);
    if (format === 'cjs') {
        return [
            runtimeModuleId ? `const __traduki = require('${runtimeModuleId}');` : '',
            registerMapString ? `__traduki.register({\n${registerMapString}\n});` : '',
            `modules.export = ${messagesMapString};\n`,
        ].join('\n');
    }

    return [
        runtimeModuleId ? `import __traduki from '${runtimeModuleId}';` : '',
        registerMapString ? `__traduki.register({\n${registerMapString}\n});` : '',
        `export default ${messagesMapString};\n`,
    ].join('\n');
}

/**
 * Precompile the messages object and output the source code
 * in 'cjs' or 'esm' format
 */
export function generatePrecompiledMessages(
    locale: Locale,
    messages: Messages,
    format: string = 'esm',
) {
    const messageformat = new MessageFormat(locale);
    return messageformat.compile(messages).toString(messagesFormatExport[format]);
}

/**
 * Helper function for Array.filter() to filter out empty array items
 */
export function notEmpty<TValue>(value: TValue | null | undefined): value is TValue {
    return value !== null && value !== undefined;
}

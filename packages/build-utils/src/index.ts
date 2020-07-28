import fs from 'fs';
import * as Yaml from 'js-yaml';
import hash from 'hash-sum';
import MessageFormat from 'messageformat';

export type Locale = string;

export type Messages = Record<string, string>;

export type MessagesMap = Record<string, string>;

export type Dictionaries = Record<Locale, Messages>;

export type KeyHashFnArgs = { key: string; path: string; text: string };

const messagesFormatExport: Record<string, string | undefined> = {
    amd: 'module.exports',
    cjs: 'module.exports',
    es: 'export default',
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
 * { hello: "Hello world!" } -> { hello_5nf85: "Hello world!" }
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
    runtimeModuleId: string,
    registerMap: Record<Locale, string>,
    messagesMap: MessagesMap,
    format: 'cjs' | 'esm' = 'esm',
): string {
    const registerMapString = Object.keys(registerMap)
        .map(locale => `${locale}: ${registerMap[locale]}`)
        .join(',');
    const messagesMapString = JSON.stringify(messagesMap);
    if (format === 'cjs') {
        return [
            `const runtime = require('${runtimeModuleId}');`,
            `runtime.register({${registerMapString}});`,
            `modules.export = ${messagesMapString};`,
        ].join('\n');
    }

    return [
        `import runtime from '${runtimeModuleId}';`,
        `runtime.register({${registerMapString}});`,
        `export default ${messagesMapString};`,
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

const getResolveUrl = (path: string, URL = 'URL') => `new ${URL}(${path}).href`;

const getRelativeUrlFromDocument = (relativePath: string) =>
    getResolveUrl(
        `'${relativePath}', document.currentScript && document.currentScript.src || document.baseURI`,
    );

/**
 * Generate source code for relative url mechanism (copy/pasted from Rollup & refactored)
 */
export function generateUrlMechanism(relativePath: string, format: string = 'esm') {
    switch (format) {
        case 'amd':
            if (relativePath[0] !== '.') relativePath = './' + relativePath;
            return getResolveUrl(`require.toUrl('${relativePath}'), document.baseURI`);

        case 'cjs': {
            const browserUrl = getRelativeUrlFromDocument(relativePath);
            const nodeUrl = getResolveUrl(
                `'file:' + __dirname + '/${relativePath}'`,
                `(require('u' + 'rl').URL)`,
            );
            return `(typeof document === 'undefined' ? ${nodeUrl} : ${browserUrl})`;
        }
        case 'es':
            return getResolveUrl(`'${relativePath}', import.meta.url`);

        case 'iife':
            return getRelativeUrlFromDocument(relativePath);

        case 'system':
            return getResolveUrl(`'${relativePath}', module.meta.url`);

        case 'umd': {
            const browserUrl = getRelativeUrlFromDocument(relativePath);
            const nodeUrl = getResolveUrl(
                `'file:' + __dirname + '/${relativePath}'`,
                `(require('u' + 'rl').URL)`,
            );
            return `(typeof document === 'undefined' ? ${nodeUrl} : ${browserUrl})`;
        }
        default:
            throw new Error(`invalid format ${format}`);
    }
}

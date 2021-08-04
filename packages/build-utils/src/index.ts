import fs from 'fs';
import hashSum from 'hash-sum';
import { load as loadYaml } from 'js-yaml';
import MessageFormat from 'messageformat';
import { minify as terserMinify } from 'terser';

export type Locale = string;

export type Messages = Record<string, string>;

export type MessagesMap = Record<string, string>;

export type RegisterMap = Record<Locale, string>;

export type Dictionaries = Record<Locale, Messages>;

export type KeyHashFnArgs = { key: string; texts: string[] };

export type RegisterOptions = {
    format?: 'cjs' | 'esm';
};

const TRADUKI_RUNTIME_MODULE = '@traduki/runtime';

const messagesFormatExport: Record<string, string | undefined> = {
    amd: 'module.exports',
    cjs: 'module.exports',
    es: 'export default',
    esm: 'export default',
    iife: '', // TODO
    system: '', // TODO
    umd: undefined,
};

function uniqueKeys(objects: Record<string, any>[]): Set<string> {
    return new Set(
        objects.reduce((keys: string[], object) => keys.concat(Object.keys(object)), []),
    );
}

function nestedObjects<T>(objects: Record<string, Record<string, T>>): Record<string, T>[] {
    return Object.keys(objects).map(id => objects[id]);
}

export function defaultKeyHashFn(data: KeyHashFnArgs) {
    return hashSum(data.key + '_' + data.texts.join('|'));
}

export function hash(data: string) {
    return hashSum(data);
}

/**
 * Creates a messages mapping object from a dictionary object
 * { en: { hello: "Hello world!" }, 'nl-NL': { hello: "Hallo wereld!" } }-> { hello: "hello_5nf85" }
 */
export function toMessagesMap(
    dictionaries: Dictionaries,
    keyHashFn: (data: KeyHashFnArgs) => string = defaultKeyHashFn,
): MessagesMap {
    const objects = nestedObjects<string>(dictionaries);
    const keys = uniqueKeys(objects);

    return [...keys].reduce(
        (prev, key) => ({
            ...prev,
            [key]: `${key}_${keyHashFn({
                key,
                texts: objects.map(o => o[key]).filter(notEmpty),
            })}`,
        }),
        {},
    );
}

/**
 * Check if nested object keys are all the same
 */
export function assertIsConsistent(nestedObjects: Record<string, Record<string, any>>): boolean {
    const objects = Object.keys(nestedObjects).map(id => nestedObjects[id]);
    const keys = uniqueKeys(objects);
    return objects.every(object => keys.size === Object.keys(object).length);
}

/**
 * Parse Yaml
 */
export function parseYaml(data: string): Dictionaries {
    return loadYaml(data) as Dictionaries;
}

/**
 * Locale as var eg. 'nl-NL' -> '$nl_NL';
 * Using '$' to handle numbers at char 0 and handle reservered words.
 * Escape forbidden characters
 */
export function toVarIdentifier(locale: string): string {
    return `$${locale.replace(/[ &\/\\#,+()$~%.'":*?<>{}-]/g, '_')}`;
}

/**
 * Locale as part of file name
 */
export function toPathIdentifier(locale: string): string {
    return locale.replace(/[ &\/\\#,+()$~%.'":*?<>{}]/g, '-').toLowerCase();
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
 * Generate source code that when runs registers the location of the precompiled messages bundles for each locale
 */
export function generateImporters(
    moduleIdentifier: string,
    registerMap: Record<Locale, string>,
    { format, ...options }: RegisterOptions = {},
): string {
    const registerMapString = Object.keys(registerMap)
        .map(locale => `\t'${locale}': ${registerMap[locale]}`)
        .join(',\n');

    const args = [`'${moduleIdentifier}'`, `{\n${registerMapString}\n}`];

    if (Object.keys(options).length > 0) args.push(JSON.stringify(options));

    if (format === 'cjs') {
        return [
            `const __traduki = require('${TRADUKI_RUNTIME_MODULE}');`,
            `__traduki.register(${args.join()});`,
        ].join('\n');
    }

    return [
        `import __traduki from '${TRADUKI_RUNTIME_MODULE}';`,
        `__traduki.register(${args.join()});`,
    ].join('\n');
}

type GenerateExportMappingOptions = {
    format?: 'cjs' | 'esm';
    debugSource?: string;
};

/**
 * Generate source code that when runs exports the messages map object to be used in the application.
 */
export function generateExportMapping(
    messagesMap: any,
    options: GenerateExportMappingOptions = {},
): string {
    const { format = 'esm', debugSource } = options;
    const messagesMapString = JSON.stringify(messagesMap, null, 4);
    const exportString = format === 'cjs' ? 'modules.export = ' : 'export default ';

    if (debugSource) {
        // prettier-ignore
        return `
const target = ${messagesMapString};

const handler = {
  get: function(target, prop, receiver) {
    if (target[prop] === undefined) {
      console.warn(\`[traduki] Message key '\${prop}' does not exist in ${debugSource}\`);
      return \`[\${prop}]\`;
    }
    return target[prop];
  }
};

${exportString} new Proxy(target, handler);
`;
    }

    return `${exportString}${messagesMapString};\n`;
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
 * Minify code
 */
export async function minify(source: string) {
    const result = await terserMinify(source, {
        module: true,
        ecma: 2016,
        compress: {
            unsafe_arrows: true,
        },
    });

    return result.code as string;
}

/**
 * Helper function for Array.filter() to filter out empty array items
 */
export function notEmpty<TValue>(value: TValue | null | undefined): value is TValue {
    return value !== null && value !== undefined;
}

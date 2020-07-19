import * as fs from 'fs';
import hash from 'hash-sum';
import * as Yaml from 'js-yaml';
import MessageFormat from 'messageformat';
import * as path from 'path';
import { Plugin } from 'rollup';
import {
    mapMessageKeys,
    messagesFormatExport,
    notEmpty,
    relativeUrlMechanisms,
    toMessagesMap,
} from './helpers';

type KeyHashArgs = {
    key: string;
    path: string;
};

type MessageModule = {
    id: string;
    language: string;
    referenceId: string;
    messages: Record<string, string>;
};

type PluginOptions = {
    runtimeModuleId?: string | null | false; // TODO: support null and false
    primaryLocale?: string;
    keyHashFn?: (args: KeyHashArgs) => string;
    endsWith?: string;
};

function defaultKeyHashFn({ key, path }: KeyHashArgs) {
    return hash(`${key}_${path}`);
}

const IDENTIFIER = 'LAZY_LION_5008cbd5';

const lazyLionPlugin = (options: PluginOptions = {}): Plugin => {
    const {
        runtimeModuleId = '@lazy-lion/runtime',
        primaryLocale = 'en',
        keyHashFn = defaultKeyHashFn,
        endsWith = '.messages.yaml',
    } = options;

    const modules: MessageModule[] = [];
    const moduleToChunk = new Map<string, string>();
    const chunkModules = new Map<string, string[]>();
    const assets = new Map<string, string>();
    let format: string = '';

    return {
        name: 'lazy-lion',
        resolveId(source, importer) {
            if (importer && source.endsWith(endsWith)) {
                return path.resolve(path.dirname(importer), source);
            }
        },
        load(id) {
            if (!id.endsWith(endsWith)) return;

            const content = fs.readFileSync(id, { encoding: 'utf8' });
            const dictionaries = Yaml.load(content);
            const languages = Object.keys(dictionaries);
            const messages = dictionaries[primaryLocale];
            const messagesMap = toMessagesMap(messages, key =>
                keyHashFn({
                    key,
                    path: id,
                }),
            );

            // Create a dummy asset file for each language in the yaml
            // Return runtime code with references to those assets
            // In the resolveFileUrl the dummy asset will be replaced with the bundled asset file.
            const references = languages
                .map(language => {
                    if (!dictionaries.hasOwnProperty(language)) {
                        console.warn(`[lazy-lion] Missing language ${language} for ${id}`);
                        return;
                    }

                    const referenceId = this.emitFile({
                        type: 'asset',
                        name: `${path.basename(id, endsWith)}.${language}.${IDENTIFIER}.js`,
                        source: `${id}.${language}`,
                    });

                    modules.push({
                        id,
                        language,
                        referenceId,
                        messages: mapMessageKeys(dictionaries[language], messagesMap),
                    });

                    return { language, referenceId };
                })
                .filter(notEmpty);

            const jsonExport = JSON.stringify(messagesMap);
            const registerMap = references
                .map(ref => `${ref.language}: import.meta.ROLLUP_FILE_URL_${ref.referenceId}`)
                .join(',');

            return `
                import runtime from '${runtimeModuleId}';

                runtime.register({${registerMap}});

                export default ${jsonExport};
            `;
        },
        outputOptions(options) {
            format = options.format || 'es';

            return options;
        },
        augmentChunkHash(chunk) {
            const moduleIds = Object.keys(chunk.modules);
            moduleIds.forEach(moduleId => moduleToChunk.set(moduleId, chunk.name));
            chunkModules.set(chunk.name, moduleIds);
        },
        resolveFileUrl({ moduleId, format, fileName, relativePath }) {
            if (!relativePath.includes(IDENTIFIER)) return null;

            const language = modules.find(m => this.getFileName(m.referenceId) === fileName)
                ?.language;
            const chunkName = moduleToChunk.get(moduleId) as string;
            const bundleName = `${chunkName}.${language}.js`;

            if (!assets.has(bundleName)) {
                const messageformat = new MessageFormat(language);
                const includeModules = chunkModules.get(chunkName) || [];

                const messages = modules
                    .filter(m => m.language === language)
                    .filter(m => includeModules.indexOf(m.id) > -1)
                    .reduce(
                        (messages, module) => ({
                            ...messages,
                            ...module.messages,
                        }),
                        {},
                    );

                const source = messageformat
                    .compile(messages)
                    .toString(messagesFormatExport[format]);

                const referenceId = this.emitFile({
                    type: 'asset',
                    name: bundleName,
                    source,
                });

                assets.set(bundleName, referenceId);
            }

            const referenceId = assets.get(bundleName);
            return relativeUrlMechanisms[format](this.getFileName(referenceId as string));
        },
        async generateBundle(_options, bundle) {
            Object.keys(bundle).forEach(fileName => {
                if (fileName.includes(IDENTIFIER)) {
                    delete bundle[fileName];
                }
            });
        },
    };
};

export default lazyLionPlugin;
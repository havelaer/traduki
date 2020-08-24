import {
    generateImporters,
    generateExportMapping,
    generatePrecompiledMessages,
    KeyHashFnArgs,
    notEmpty,
    readYaml,
    toMessagesMap,
    transformMessageKeys,
    Dictionaries,
    minify as minifyBundle,
} from '@traduki/build-utils';
import * as path from 'path';
import { Plugin, OutputAsset, OutputChunk } from 'rollup';
import { createFilter } from '@rollup/pluginutils';

type MessageModule = {
    id: string;
    locale: string;
    referenceId: string;
    messages: Record<string, string>;
    fileName?: string;
};

export type PluginOptions = {
    runtimeModuleId?: string;
    publicPath?: string;
    keyHashFn?: (data: KeyHashFnArgs) => string;
    endsWith?: string | RegExp | (string | RegExp)[];
    include?: string | RegExp | (string | RegExp)[];
    exclude?: string | RegExp | (string | RegExp)[];
    minify?: boolean;
};

const IDENTIFIER = 'TRADUKI_UNIQUE_IDENTIFIER';

function isChunk(item: OutputChunk | OutputAsset): item is OutputChunk {
    return item.type === 'chunk';
}

const tradukiPlugin = (options: PluginOptions = {}): Plugin => {
    const config = {
        runtimeModuleId: '@traduki/runtime',
        publicPath: '/',
        include: /\.messages\.yaml$/,
        minify: true,
        ...options,
    };

    const filter = createFilter(config.include, config.exclude);
    const modules: MessageModule[] = [];
    let format: string = '';

    return {
        name: 'traduki',
        resolveId(source, importer) {
            if (!filter(source) || !importer) return;

            return path.resolve(path.dirname(importer), source);
        },
        async load(id) {
            if (!filter(id)) return;

            const dictionaries = await readYaml(id);
            const locales = Object.keys(dictionaries);
            const messagesMap = toMessagesMap(dictionaries, config.keyHashFn);

            // Create a dummy asset file for each locale in the yaml
            // Return runtime code with references to those assets
            // In the resolveFileUrl the dummy asset will be replaced with the bundled asset file.
            const references = locales
                .map(locale => {
                    const referenceId = this.emitFile({
                        type: 'asset',
                        name: `${path.basename(id)}.${locale}.${IDENTIFIER}.js`,
                        source: `/* ${id}.${locale} */`,
                    });

                    modules.push({
                        id,
                        locale,
                        referenceId,
                        messages: transformMessageKeys(dictionaries[locale], messagesMap),
                    });

                    return { locale, referenceId };
                })
                .filter(notEmpty);

            // A map of locales pointing to a Rollup placeholder `import.meta.ROLLUP_FILE_URL_`
            // The placeholder will be replaced later by `resolveFileUrl`
            const registerMap = references.reduce(
                (map, reference) => ({
                    ...map,
                    [reference.locale]: `() => import(import.meta.ROLLUP_FILE_URL_${reference.referenceId})`,
                }),
                {},
            );

            return [
                generateImporters(registerMap, config.runtimeModuleId),
                generateExportMapping(messagesMap),
            ].join('\n');
        },
        outputOptions(options) {
            format = options.format || 'es';

            return options;
        },
        resolveFileUrl({ fileName, relativePath }) {
            if (!relativePath.includes(IDENTIFIER)) return null;

            const module = modules.find(m => this.getFileName(m.referenceId) === fileName);

            if (!module) {
                throw new Error(`No info found for ${fileName}`);
            }

            module.fileName = fileName;

            return `'${fileName}'`;
        },
        async generateBundle(_options, bundle) {
            const promises: Promise<void>[] = [];

            Object.keys(bundle).map(fileName => {
                const item = bundle[fileName];

                // Remove (dummy) local messages files
                if (fileName.includes(IDENTIFIER)) {
                    delete bundle[fileName];
                    return null;
                }

                // Bundle messages to global files
                if (isChunk(item)) {
                    const chunkName = item.name;
                    const referencedModules = item.referencedFiles
                        .map(referencedFile => {
                            return modules.find(m => m.fileName === referencedFile);
                        })
                        .filter(notEmpty);
                    const dictionaries = referencedModules.reduce((messages, module) => {
                        const { locale } = module;
                        return {
                            ...messages,
                            [locale]: {
                                ...messages[locale],
                                ...module.messages,
                            },
                        };
                    }, {} as Dictionaries);
                    const locales = Object.keys(dictionaries);

                    promises.concat(
                        locales.map(async locale => {
                            const bundleName = `${chunkName}.${locale}.js`;
                            const messages = dictionaries[locale];
                            const rawSource = generatePrecompiledMessages(locale, messages, format);
                            const source = config.minify ? await minifyBundle(rawSource) : rawSource;
                            const referenceId = this.emitFile({
                                type: 'asset',
                                name: bundleName,
                                source,
                            });
                            const fileName = this.getFileName(referenceId);

                            referencedModules
                                .filter(module => module.locale === locale)
                                .forEach(module => {
                                    if (!module.fileName) return;

                                    const publicPath = config.publicPath;
                                    const optionalSlash =
                                        publicPath.charAt(publicPath.length - 1) === '/' ? '' : '/';
                                    const filePath = `${publicPath}${optionalSlash}${fileName}`;
                                    item.code = item.code.replace(module.fileName, filePath);
                                });
                        }),
                    );
                }

                return null;
            });

            await Promise.all(promises);
        },
    };
};

export default tradukiPlugin;

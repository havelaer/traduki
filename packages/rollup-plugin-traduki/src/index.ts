import {
    generateMapping,
    generatePrecompiledMessages,
    generateUrlMechanism,
    KeyHashFnArgs,
    notEmpty,
    readYaml,
    toMessagesMap,
    transformMessageKeys,
} from '@traduki/build-utils';
import * as path from 'path';
import { Plugin } from 'rollup';

type MessageModule = {
    id: string;
    locale: string;
    referenceId: string;
    messages: Record<string, string>;
};

type PluginOptions = {
    runtimeModuleId?: string; // TODO: support null and false
    primaryLocale?: string;
    keyHashFn?: (data: KeyHashFnArgs) => string;
    endsWith?: string;
};

const IDENTIFIER = 'TRADUKI_5008cbd5';

const tradukiPlugin = (options: PluginOptions = {}): Plugin => {
    const {
        runtimeModuleId = '@traduki/runtime',
        primaryLocale = 'en',
        keyHashFn,
        endsWith = '.messages.yaml',
    } = options;

    const modules: MessageModule[] = [];
    const moduleToChunk = new Map<string, string>();
    const chunkModules = new Map<string, string[]>();
    const assets = new Map<string, string>();
    let format: string = '';

    return {
        name: 'traduki',
        resolveId(source, importer) {
            if (importer && source.endsWith(endsWith)) {
                return path.resolve(path.dirname(importer), source);
            }
        },
        async load(id) {
            if (!id.endsWith(endsWith)) return;

            const dictionaries = await readYaml(id);
            const locales = Object.keys(dictionaries);
            const messages = dictionaries[primaryLocale];
            const messagesMap = toMessagesMap(messages, id, keyHashFn);

            // Create a dummy asset file for each locale in the yaml
            // Return runtime code with references to those assets
            // In the resolveFileUrl the dummy asset will be replaced with the bundled asset file.
            const references = locales
                .map(locale => {
                    const referenceId = this.emitFile({
                        type: 'asset',
                        name: `${path.basename(id)}.${locale}.${IDENTIFIER}.js`,
                        source: `${id}.${locale}`,
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
                    [reference.locale]: `import.meta.ROLLUP_FILE_URL_${reference.referenceId}`,
                }),
                {},
            );

            return generateMapping(runtimeModuleId, registerMap, messagesMap);
        },
        outputOptions(options) {
            format = options.format || 'es';

            return options;
        },
        augmentChunkHash(chunk) {
            // Create mapping from chunk to child modules
            const moduleIds = Object.keys(chunk.modules);
            moduleIds.forEach(moduleId => moduleToChunk.set(moduleId, chunk.name));
            chunkModules.set(chunk.name, moduleIds);
        },
        resolveFileUrl({ moduleId, format, fileName, relativePath }) {
            if (!relativePath.includes(IDENTIFIER)) return null;

            const module = modules.find(m => this.getFileName(m.referenceId) === fileName);

            if (!module) {
                throw new Error(`No info found for ${fileName}`);
            }

            const { locale } = module;
            const chunkName = moduleToChunk.get(moduleId) as string;
            const bundleName = `${chunkName}.${locale}.js`;

            if (!assets.has(bundleName)) {
                const includeModules = chunkModules.get(chunkName) || [];

                const messages = modules
                    .filter(m => m.locale === locale)
                    .filter(m => includeModules.indexOf(m.id) > -1)
                    .reduce(
                        (messages, module) => ({
                            ...messages,
                            ...module.messages,
                        }),
                        {},
                    );

                const source = generatePrecompiledMessages(locale, messages, format);
                const referenceId = this.emitFile({
                    type: 'asset',
                    name: bundleName,
                    source,
                });

                assets.set(bundleName, referenceId);
            }

            const referenceId = assets.get(bundleName);
            return generateUrlMechanism(this.getFileName(referenceId as string), format);
        },
        async generateBundle(_options, bundle) {
            // Remove dummy asset files
            Object.keys(bundle).forEach(fileName => {
                if (fileName.includes(IDENTIFIER)) {
                    delete bundle[fileName];
                }
            });
        },
    };
};

export default tradukiPlugin;

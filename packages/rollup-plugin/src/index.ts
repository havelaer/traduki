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
    hash,
    minify as minifyBundle,
} from '@traduki/build-utils';
import * as path from 'path';
import { Plugin, RenderedChunk } from 'rollup';
import { createFilter } from '@rollup/pluginutils';
import MagicString from 'magic-string';

type MessageModule = {
    id: string;
    locale: string;
    referenceId: string;
    messages: Record<string, string>;
};

export type PluginOptions = {
    publicPath?: string;
    keyHashFn?: (data: KeyHashFnArgs) => string;
    endsWith?: string | RegExp | (string | RegExp)[];
    include?: string | RegExp | (string | RegExp)[];
    exclude?: string | RegExp | (string | RegExp)[];
    minify?: boolean;
};

const tradukiPlugin = (options: PluginOptions = {}): Plugin => {
    const config = {
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

            const moduleIdentifier = hash(id);
            const dictionaries = await readYaml(id);
            const locales = Object.keys(dictionaries);
            const messagesMap = toMessagesMap(dictionaries, config.keyHashFn);

            // Create a dummy asset file for each locale in the yaml
            // Return runtime code with references to those assets
            // In the resolveFileUrl the dummy asset will be replaced with the bundled asset file.
            const references = locales
                .map(locale => {
                    const referenceId = hash(`${id}_${locale}`);

                    modules.push({
                        id,
                        locale,
                        referenceId,
                        messages: transformMessageKeys(dictionaries[locale], messagesMap),
                    });

                    return { locale, referenceId };
                })
                .filter(notEmpty);

            // A map of locales pointing to a placeholder `TRADUKI_URL_XXXXXXXX`
            // The placeholder will be replaced in the `renderChunk` hook
            const registerMap = references.reduce(
                (map, reference) => ({
                    ...map,
                    [reference.locale]: `() => import(TRADUKI_URL_${reference.referenceId})`,
                }),
                {},
            );

            return [
                generateImporters(moduleIdentifier, registerMap),
                generateExportMapping(messagesMap),
            ].join('\n');
        },
        outputOptions(options) {
            format = options.format || 'es';

            return options;
        },
        async renderChunk(code: string, chunk: RenderedChunk) {
            const s = new MagicString(code);

            // Bundle messages to global files
            const chunkName = chunk.name;
            const referencedModules = modules
                .filter(m => code.includes(`TRADUKI_URL_${m.referenceId}`))
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

            const promises = locales.map(async locale => {
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
                        const publicPath = config.publicPath;
                        const optionalSlash =
                            publicPath.charAt(publicPath.length - 1) === '/' ? '' : '/';
                        const filePath = `'${publicPath}${optionalSlash}${fileName}'`;
                        const ref = `TRADUKI_URL_${module.referenceId}`;

                        let i = 0;
                        while (true) {
                            const start = code.indexOf(ref, i + 1);
                            if (start === -1) break;
                            const end = start + ref.length;
                            s.overwrite(start, end, filePath);
                            i = start;
                        }
                    });
            });

            await Promise.all(promises);

            const sourceMap = s.generateMap({
                source: chunk.fileName,
                hires: true,
            });

            return {
                code: s.toString(),
                map: sourceMap,
            };
        },
    };
};

export default tradukiPlugin;

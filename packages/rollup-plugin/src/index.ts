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
    assertIsConsistent,
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
    strict?: false | 'warn' | 'error';
    /**
     * Determine how you want to split the locales.
     *
     * 'chunk': Beside each entry and chunk file,
     *          compiled messages files are generated for each locale.
     *
     *          Used for huge size applications with lots of supported locales
     *
     *          eg:
     *              main.js,
     *              main.en_US.js, (could contain shared messages in main and chunk)
     *              main.nl_NL.js, (could contain shared messages in main and chunk)
     *              chunk_1.js
     *              chunk_1.en_US.js
     *              chunk_1.nl_NL.js
     *
     * 'entry': Beside each entry file,
     *          compiled messages files are generated for each locale
     *          which also contain messages from chunks.
     *
     *          Used for small/medium size applications with lots of supported locales
     *          eg:
     *              main.js,
     *              main.en_US.js, (also contains messages from chunk_1.js)
     *              main.nl_NL.js, (also contains messages from chunk_1.js)
     *              chunk_1.js
     *
     * false:   Compiled messages files are not split by locale,
     *          they are bundled with their dependent entry or chunk file.
     *
     *          Used for small/medium size applications with 1 or 2 locales.
     *
     *          eg:
     *              main.js, (also bundles compiled messages files)
     *              chunk_1.js (also bundles compiled messages files)
     *
     */
    splitAt?: 'chunk' | 'entry' | false;
};

const tradukiPlugin = (options: PluginOptions = {}): Plugin => {
    const config = {
        publicPath: '/',
        include: /\.messages\.yaml$/,
        minify: true,
        strict: 'warn',
        splitAt: 'chunk',
        ...options,
    };

    const noSplit = config.splitAt === false;
    const entrySplit = config.splitAt === 'entry';
    const chunkSplit = config.splitAt === 'chunk';
    const filter = createFilter(config.include, config.exclude);
    const modules: MessageModule[] = [];
    let format: string = '';

    return {
        name: 'traduki',

        /*
         * Resolve `*.messages.yaml` and `*.messages.yaml.<locale>.js` files.
         * The latter only in the case of `config.splitAt: false` and identify it by importer.
         */
        resolveId(source, importer) {
            if (importer && (filter(source) || (noSplit && importer && filter(importer)))) {
                return path.resolve(path.dirname(importer), source);
            }
        },

        /*
         * Load `*.messages.yaml` and `*.messages.yaml.<locale>.js` files.
         * The latter only in the case of `config.splitAt: false` a.k.a. "noSplit"
         */
        async load(id) {
            const noSplitModule = noSplit
                ? modules.find(m => id === `${m.id}.${m.locale}.js`)
                : null;

            if (noSplitModule) {
                return generatePrecompiledMessages(
                    noSplitModule.locale,
                    noSplitModule.messages,
                    format,
                );
            }

            if (!filter(id)) return;

            const code = [];
            const moduleIdentifier = hash(id);
            const dictionaries = await readYaml(id);

            if (config.strict && !assertIsConsistent(dictionaries)) {
                const error = `Inconsistent messages file: '${id}'`;

                if (config.strict === 'warn') {
                    this.warn(error);
                } else if (config.strict === 'error') {
                    this.error(error);
                }
            }

            const locales = Object.keys(dictionaries).map(locale => locale.replace(/-/g, '_'));
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
                    [reference.locale]: noSplit
                        ? `() => Promise.resolve(${reference.locale})`
                        : `() => import(TRADUKI_URL_${reference.referenceId})`,
                }),
                {},
            );

            if (noSplit) {
                code.push(
                    ...references.map(reference => {
                        return `import ${reference.locale} from './${path.basename(id)}.${reference.locale}.js'`;
                    }),
                );
            }

            code.push(generateImporters(moduleIdentifier, registerMap));
            code.push(generateExportMapping(messagesMap));

            return code.join('\n');
        },
        outputOptions(options) {
            format = options.format || 'es';

            return options;
        },
        async renderChunk(code: string, chunk: RenderedChunk) {
            const s = new MagicString(code);

            if (noSplit || (entrySplit && chunk.isEntry === false)) return null;

            // Bundle messages to global files
            const chunkName = chunk.name;
            const referencedModules = chunkSplit
                ? modules
                      .filter(m => code.includes(`TRADUKI_URL_${m.referenceId}`))
                      .filter(notEmpty)
                : modules;

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

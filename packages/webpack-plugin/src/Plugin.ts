import { Dictionaries, generatePrecompiledMessages, Messages, minify } from '@traduki/build-utils';
import { interpolateName } from 'loader-utils';
import validateOptions from 'schema-utils';
import webpack from 'webpack';
import { RawSource, ReplaceSource } from 'webpack-sources';
import { pluginName } from './constants';

const DEFAULT_FILENAME = '[name].[locale].js';
const DEFAULT_RUNTIME_MODULE_ID = '@traduki/runtime';
const schema = require('./plugin-options').default;

type Chunk = any; // `any` because of webpack 4 and 5 differences

type Compilation = any; // `any` because of webpack 4 and 5 differences

type MessagesSource = {
    locale: string;
    resourcePath: string;
    messages: Messages;
};

const isWebpack5 = webpack.version?.charAt(0) === '5';

// Bind plugin to loader context (for webpack 4 and 5)
function bindLoaderContext(compilation: Compilation, plugin: TradukiWebpackPlugin) {
    if (isWebpack5) {
        (webpack as any).NormalModule.getCompilationHooks(compilation).loader.tap(
            pluginName,
            (loaderContext: any) => {
                loaderContext[pluginName] = plugin;
            },
        );
    } else {
        compilation.hooks.normalModuleLoader.tap(pluginName, (loaderContext: any) => {
            loaderContext[pluginName] = plugin;
        });
    }
}

// Get modules helper (for webpack 4 and 5)
function getChunkModules(compilation: Compilation, chunk: Chunk) {
    if (isWebpack5) {
        return compilation.chunkGraph.getChunkModules(chunk);
    } else {
        return chunk.getModules();
    }
}

// Get context (for webpack 4 and 5)
function getContext(compilation: Compilation) {
    return isWebpack5 ? (compilation as any).options.context : compilation.context;
}

// Get public path (for webpack 4 and 5)
function getPublicPath(compilation: Compilation) {
    return isWebpack5
        ? (compilation as any).getAssetPath(compilation.outputOptions.publicPath as any, {})
        : compilation.outputOptions.publicPath;
}

// Get public path (for webpack 4) TODO: test webpack 5
// function isDevelopment(compilation: Compilation) {
//     return compilation.options.optimization.nodeEnv === 'development';
// }

// Get public path (for webpack 4) TODO: test webpack 5
function isProduction(compilation: Compilation) {
    return compilation.options.optimization.nodeEnv === 'production';
}

export default class TradukiWebpackPlugin {
    static loader: string = '';

    private config: any;
    private messagesSource: MessagesSource[] = [];
    private chunkMessagesDictionaries: Map<any, Dictionaries> | null = null;

    constructor(options = {}) {
        validateOptions(schema, options, { name: pluginName });

        this.config = Object.assign(
            {
                minify: false,
                filename: DEFAULT_FILENAME,
                runtimeModuleId: DEFAULT_RUNTIME_MODULE_ID,
                strict: 'warn',
            },
            options,
        );

        if (!/\[locale\]/.test(this.config.filename)) {
            throw new Error('[traduki] filename should contain "[locale]"');
        }
    }

    apply(compiler: webpack.Compiler) {
        compiler.hooks.thisCompilation.tap(pluginName, compilation => {
            const context = getContext(compilation);
            const publicPath = getPublicPath(compilation);

            /*
             * Bind plugin instance to loader context,
             * so the loader can add messages to the plugin when transforming messages files.
             */
            bindLoaderContext(compilation, this);

            /*
             * After `afterOptimizeTree` the modules are devided in chunks.
             * Here we create raw messages bundels for each chunk
             *   chunk -> { <locale1>: {...}, <locale2>: {...}, etc. }
             */
            compilation.hooks.afterOptimizeTree.tap(pluginName, chunks => {
                this.chunkMessagesDictionaries = new Map();

                for (const chunk of chunks) {
                    const chunkNormalModuleFiles = getChunkModules(compilation, chunk)
                        .map((m: any) => m.resource)
                        .filter(Boolean);

                    const dictionaries = this.messagesSource.reduce((dictionaries, source) => {
                        if (!chunkNormalModuleFiles.includes(source.resourcePath))
                            return dictionaries;

                        return {
                            ...dictionaries,
                            [source.locale]: {
                                ...dictionaries[source.locale],
                                ...source.messages,
                            },
                        };
                    }, {} as Dictionaries);

                    this.chunkMessagesDictionaries!.set(chunk, dictionaries);
                }
            });

            /*
             * Compile the message bundles so we can create filenames
             * (if we want content based hashes we need the output content)
             *
             * Having a filename we can find and replace the url placeHolders.
             */
            compilation.hooks.optimizeChunkAssets.tapPromise(pluginName, async () => {
                const queue: Promise<any>[] = [];

                this.chunkMessagesDictionaries!.forEach((dictionaries, chunk) => {
                    const locales = Object.keys(dictionaries);

                    queue.concat(locales.map(async locale => {
                        // Compile messages bundles per locale
                        const raw = generatePrecompiledMessages(locale, dictionaries[locale]);
                        const content = isProduction(compilation) ? await minify(raw) : raw;

                        // Generate file name and public file name
                        const optionalSlash =
                            publicPath.charAt(publicPath.length - 1) === '/' ? '' : '/';
                        const fileName = interpolateName(
                            {
                                resourcePath: `path/${chunk.name || chunk.id}.js`,
                            } as any,
                            this.config.filename.replace('[locale]', locale),
                            { content, context },
                        );
                        const publicFileName = publicPath + optionalSlash + fileName;

                        // Add compiled messsages bundle to assets
                        compilation.assets[fileName] = new RawSource(content);

                        // Find and replace messages bundle urls in chunks
                        chunk.files.forEach((file: string) => {
                            const sourceCode = compilation.assets[file].source();
                            const newSource = new ReplaceSource(compilation.assets[file], file);

                            this.replaceByPlaceHolder(
                                sourceCode,
                                newSource,
                                this.createPlaceHolder(locale),
                                publicFileName,
                            );

                            compilation.assets[file] = newSource;
                        });
                    }));

                });

                await Promise.all(queue);
            });
        });
    }

    addMessages(source: MessagesSource) {
        this.messagesSource = this.messagesSource.filter(
            s => !(s.resourcePath === source.resourcePath && s.locale === source.locale),
        );
        this.messagesSource.push(source);
    }

    createPlaceHolder(locale: string) {
        return `$$${pluginName}_${locale}$$`;
    }

    private replaceByPlaceHolder(
        sourceCode: string,
        newSource: ReplaceSource,
        placeHolder: string,
        replacement: string,
        searchIndex: number = 0,
    ) {
        const placeHolderPos = sourceCode.indexOf(placeHolder, searchIndex);

        if (placeHolderPos > -1) {
            newSource.replace(placeHolderPos, placeHolderPos + placeHolder.length - 1, replacement);

            // Keep searching from current found placeholder
            this.replaceByPlaceHolder(
                sourceCode,
                newSource,
                placeHolder,
                replacement,
                placeHolderPos + 1,
            );
        }
    }
}

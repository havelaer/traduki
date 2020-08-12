import { generatePrecompiledMessages, Messages } from '@traduki/build-utils';
import { interpolateName } from 'loader-utils';
import validateOptions from 'schema-utils';
import webpack from 'webpack';
import { RawSource, OriginalSource } from 'webpack-sources';
import { pluginName } from './constants';

const DEFAULT_FILENAME = '[name].[locale].js';
const DEFAULT_RUNTIME_MODULE_ID = '@traduki/runtime';
const schema = require('./plugin-options').default;

type MessagesSource = {
    locale: string;
    resourcePath: string;
    messages: Messages;
};

type MessagesAsset = {
    fileName: string;
    publicFileName: string;
    content: string;
};

type UrlReplacement = {
    from: string;
    to: string;
};

export default class TradukiWebpackPlugin {
    static loader: string = '';

    private options: any;

    private messagesSource: MessagesSource[] = [];

    private messagesAssets: MessagesAsset[] = [];

    constructor(options = {}) {
        validateOptions(schema, options, { name: pluginName });

        this.options = Object.assign(
            {
                filename: DEFAULT_FILENAME,
                runtimeModuleId: DEFAULT_RUNTIME_MODULE_ID,
            },
            options,
        );

        if (!/\[locale\]/.test(this.options.filename)) {
            throw new Error('[traduki] filename should contain [locale]');
        }
    }

    apply(compiler: webpack.Compiler) {
        const { NormalModule } = webpack as any; // webpack 5+
        const isWebpack5 = !!NormalModule;

        compiler.hooks.thisCompilation.tap(pluginName, compilation => {
            const context = isWebpack5 ? (compilation as any).options.context : compilation.context;

            // Bind plugin to loader context
            const bindLoaderContext = (loaderContext: any) => {
                loaderContext[pluginName] = this;
            };

            if (isWebpack5) {
                NormalModule.getCompilationHooks(compilation).loader.tap(
                    pluginName,
                    bindLoaderContext,
                );
            } else {
                compilation.hooks.normalModuleLoader.tap(pluginName, bindLoaderContext);
            }

            // Get modules helper for webpack 4 and 5
            const getChunkModules = (compilation: any, chunk: any) => {
                if (isWebpack5) {
                    return compilation.chunkGraph.getChunkModules(chunk);
                } else {
                    return chunk.getModules();
                }
            };

            /*
             * The Chunk ids are known at this point
             * Here we create the precompiled messages javascript bundles per chunk per locale.
             * A filename is generated with the chunk id and the bundle's content.
             * The generated filename is replaced in the transformed *.messages.yaml modules as remote import source.
             */
            compilation.hooks.afterOptimizeChunkIds.tap(pluginName, chunks => {
                const publicPath = isWebpack5
                    ? (compilation as any).getAssetPath(
                          compilation.outputOptions.publicPath as any,
                          {},
                      )
                    : compilation.outputOptions.publicPath;

                // Per Chunk
                for (const chunk of chunks) {
                    const chunkNormalModuleFiles = getChunkModules(compilation, chunk)
                        .map((m: any) => m.resource)
                        .filter(Boolean);

                    const messagesSourcesByChunk = this.messagesSource.filter(s =>
                        chunkNormalModuleFiles.includes(s.resourcePath),
                    );
                    const chunkMessagesFiles = messagesSourcesByChunk.map(s => s.resourcePath);
                    const chunkMessagesModules = getChunkModules(
                        compilation,
                        chunk,
                    ).filter((m: any) => chunkMessagesFiles.includes(m.resource));

                    const localesInChunk = new Set(messagesSourcesByChunk.map(s => s.locale));
                    const urlReplacements: UrlReplacement[] = [];

                    // Per Locale
                    localesInChunk.forEach(locale => {
                        const sourcesByLocale = messagesSourcesByChunk.filter(
                            s => s.locale === locale,
                        );
                        const bundle = sourcesByLocale.reduce(
                            (bundle, source) => ({
                                ...bundle,
                                ...source.messages,
                            }),
                            {},
                        );

                        const content = generatePrecompiledMessages(locale, bundle);
                        const optionalSlash =
                            publicPath.charAt(publicPath.length - 1) === '/' ? '' : '/';
                        const fileName = interpolateName(
                            {
                                resourcePath: `path/${chunk.name || chunk.id}.js`,
                            } as any,
                            this.options.filename.replace('[locale]', locale),
                            { content, context },
                        );
                        const publicFileName = publicPath + optionalSlash + fileName;

                        // Webpack injects some source into the source code later on.
                        // By using `/* ${'-'.padStart(32, '-')} */` we make sure the line lengths / source length keeps the same,
                        // so webpack doesn't mess up the output.
                        // TODO: find better solution. Perhaps look at ReplaceSource?
                        const from = `'$$${pluginName}_${locale}$$' /* ${'-'.padStart(32, '-')} */`;
                        const padding = from.length - publicFileName.length - 9;
                        if (padding < 0) {
                            throw new Error('[traduki] Import path is to long');
                        }

                        const to = `'${publicFileName}' /* ${'-'.padStart(padding, '-')} */`;

                        urlReplacements.push({ from, to });

                        this.messagesAssets.push({ content, fileName, publicFileName });
                    });

                    chunkMessagesModules.forEach((module: any) => {
                        const value = (module as any)._source.source();
                        const newValue = urlReplacements.reduce(
                            (value: string, { from, to }: any) => {
                                return value.replace(from, to);
                            },
                            value,
                        );

                        if (isWebpack5) {
                            module._source = module.createSource(
                                context,
                                newValue,
                                null,
                                (compilation.compiler as any).root,
                            );
                        } else {
                            module._source = new OriginalSource(newValue, module._source._name);
                        }
                    });
                }
            });

            if (isWebpack5) {
                (compilation.hooks as any).processAssets.tap(
                    {
                        name: pluginName,
                        stage: (webpack as any).Compilation.PROCESS_ASSETS_STAGE_ADDITIONS,
                    },
                    (assets: any) => {
                        this.messagesAssets.forEach(asset => {
                            const source = new RawSource(asset.content);
                            assets[asset.fileName] = source as any;
                        });
                    },
                );
            } else {
                compilation.hooks.additionalAssets.tap(pluginName, () => {
                    this.messagesAssets.forEach(asset => {
                        compilation.assets[asset.fileName] = {
                            source: function () {
                                return asset.content;
                            },
                            size: function () {
                                return asset.content.length;
                            },
                        };
                    });
                });
            }
        });
    }

    addMessages(source: MessagesSource) {
        this.messagesSource.push(source);
    }
}

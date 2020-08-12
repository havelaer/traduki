import { generatePrecompiledMessages, Messages } from '@traduki/build-utils';
import { interpolateName } from 'loader-utils';
import validateOptions from 'schema-utils';
import webpack, { Compilation, NormalModule } from 'webpack';
import { RawSource } from 'webpack-sources';
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
        compiler.hooks.thisCompilation.tap(pluginName, compilation => {
            NormalModule.getCompilationHooks(compilation).loader.tap(pluginName, loaderContext => {
                loaderContext[pluginName] = this;
            });

            /*
             * The Chunk ids are known at this point
             * Here we create the precompiled messages javascript bundles per chunk per locale.
             * A filename is generated with the chunk id and the bundle's content.
             * The generated filename is replaced in the transformed *.messages.yaml modules as remote import source.
             */
            compilation.hooks.afterOptimizeChunkIds.tap(pluginName, chunks => {
                const chunkGraph = compilation.chunkGraph;
                const publicPath = compilation.getAssetPath(
                    compilation.outputOptions.publicPath as any,
                    {},
                );

                // Per Chunk
                for (const chunk of chunks) {
                    const chunkNormalModuleFiles = chunkGraph
                        .getChunkModules(chunk)
                        .filter(m => m instanceof webpack.NormalModule)
                        .map((m: any) => m.resource);

                    const messagesSourcesByChunk = this.messagesSource.filter(s =>
                        chunkNormalModuleFiles.includes(s.resourcePath),
                    );
                    const chunkMessagesFiles = messagesSourcesByChunk.map(s => s.resourcePath);
                    const chunkMessagesModules = chunkGraph
                        .getChunkModules(chunk)
                        .filter(m => m instanceof webpack.NormalModule)
                        .map(m => m as webpack.NormalModule) // TODO: better way to do this
                        .filter((m: any) => chunkMessagesFiles.includes(m.resource));

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
                            },
                            this.options.filename.replace('[locale]', locale),
                            { content, context: compilation.options.context },
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

                    chunkMessagesModules.forEach((module: webpack.NormalModule) => {
                        const value = (module as any)._source.source();
                        const newValue = urlReplacements.reduce(
                            (value: string, { from, to }: any) => {
                                return value.replace(from, to);
                            },
                            value,
                        );

                        (module as any)._source = module.createSource(
                            compilation.options.context as string,
                            newValue,
                            null,
                            compilation.compiler.root,
                        );
                    });
                }
            });

            compilation.hooks.processAssets.tap(
                {
                    name: pluginName,
                    stage: Compilation.PROCESS_ASSETS_STAGE_ADDITIONS,
                },
                assets => {
                    this.messagesAssets.forEach(asset => {
                        const source = new RawSource(asset.content);
                        assets[asset.fileName] = source as any;
                    });
                },
            );
        });
    }

    addMessages(source: MessagesSource) {
        this.messagesSource.push(source);
    }
}

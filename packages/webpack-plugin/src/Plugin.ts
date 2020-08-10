import webpack, { NormalModule, Compilation, javascript } from 'webpack';
import { ConcatSource, OriginalSource } from 'webpack-sources';
import validateOptions from 'schema-utils';
import {
    Dictionaries,
    MessagesMap,
    Locale,
    generateMapping,
    generatePrecompiledMessages,
    generateUrlMechanism,
    KeyHashFnArgs,
    notEmpty,
    parseYaml,
    toMessagesMap,
    transformMessageKeys,
    Messages,
} from '@traduki/build-utils';
import { pluginName } from './constants';
import { interpolateName } from 'loader-utils';
import { mapMessageKeys } from '@traduki/build-utils/lib/cjs/helpers';

// https://lihautan.com/webpack-plugin-main-template/#writing-a-webpack-plugin
// https://gist.github.com/tanhauhau/b6b355fbbabe224c9242a5257baa4dec

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
                chunkFilename: DEFAULT_FILENAME,
                runtimeModuleId: DEFAULT_RUNTIME_MODULE_ID,
            },
            options,
        );

        if (!/\[locale\]/.test(this.options.chunkFilename)) {
            throw new Error('[traduki] chunkFilename should contain [locale]');
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

                // Per Chunk
                Array.from(chunks).forEach(chunk => {
                    const chunkModuleFiles = chunk
                        .getModules()
                        .map((m: any) => m.resource)
                        .filter(Boolean);

                    const messagesSourcesByChunk = this.messagesSource.filter(s =>
                        chunkModuleFiles.includes(s.resourcePath),
                    );
                    const chunkMessagesFiles = messagesSourcesByChunk.map(s => s.resourcePath);
                    const chunkMessagesModules = chunk
                        .getModules()
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
                        const fileName = interpolateName(
                            {
                                resourcePath: `path/${chunk.id}.js`,
                            },
                            this.options.chunkFilename.replace('[locale]', locale),
                            { content },
                        );

                        const from = `'$$${pluginName}_${locale}$$' /* ${'-'.padStart(32, '-')} */`;
                        const padding = from.length - fileName.length - 11;
                        if (padding < 0) {
                            throw new Error('[traduki] Import path is to long');
                        }

                        const to = `'./${fileName}' /* ${'-'.padStart(padding, '-')} */`;

                        urlReplacements.push({ from, to });

                        this.messagesAssets.push({ content, fileName });
                    });

                    chunkMessagesModules.forEach((module: any) => {
                        const value = module._source.source();
                        const newValue = urlReplacements.reduce(
                            (value: string, { from, to }: any) => {
                                return value.replace(from, to);
                            },
                            value,
                        );

                        module._source = new OriginalSource(newValue, module._source.getName());
                    });
                });
            });

            compilation.hooks.additionalAssets.tap(pluginName, () => {
                this.messagesAssets.forEach(asset => {
                    (compilation as any).assets[asset.fileName] = {
                        source: function () {
                            return asset.content;
                        },
                        size: function () {
                            return asset.content.length;
                        },
                    };
                });
            });
        });
    }

    addMessages(source: MessagesSource) {
        this.messagesSource.push(source);
    }
}

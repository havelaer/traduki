import {
    defaultKeyHashFn,
    generateMapping,
    generatePrecompiledMessages,
    parseYaml,
    toMessagesMap,
    transformMessageKeys,
} from '@traduki/build-utils';
import tradukiRollupPlugin from '@traduki/rollup-plugin-traduki';
import path from 'path';
import { Plugin, ServerPlugin } from 'vite';
import { cachedRead } from 'vite/dist/node/utils/fsUtils';

type KeyHashArgs = {
    key: string;
    path: string;
    text: string;
};

type PluginOptions = {
    publicPath?: string;
    runtimeModuleId?: string;
    primaryLocale?: string;
    keyHashFn?: (args: KeyHashArgs) => string;
    endsWith?: string;
};

function createVitePlugin(options: PluginOptions = {}): Plugin {
    const {
        runtimeModuleId = '@traduki/runtime',
        primaryLocale = 'en',
        keyHashFn = defaultKeyHashFn,
        endsWith = '.messages.yaml',
    } = options;

    const assets = new Map();

    const serverPlugin: ServerPlugin = ({
        root, // project root directory, absolute path
        app, // Koa app instance
    }) => {
        app.use(async (ctx, next) => {
            // Parse message.yaml and export messages map.
            // As side effect register for each locale the path to the compiled messages module
            if (ctx.path.endsWith(endsWith)) {
                const contents = await cachedRead(ctx, path.join(root, ctx.path));
                const dictionaries = await parseYaml(contents.toString());
                const locales = Object.keys(dictionaries);
                const messages = dictionaries[primaryLocale];
                const messagesMap = toMessagesMap(messages, ctx.path, keyHashFn);

                const references = locales.map(locale => {
                    const url = `${ctx.path}.${locale}.js`;
                    const messages = transformMessageKeys(dictionaries[locale], messagesMap);
                    const source = generatePrecompiledMessages(locale, messages, 'esm');

                    assets.set(url, source);

                    return { locale, url };
                });

                // A map of locales pointing to a Rollup placeholder `import.meta.ROLLUP_FILE_URL_`
                // The placeholder will be replaced later by `resolveFileUrl`
                const registerMap = references.reduce(
                    (map, reference) => ({
                        ...map,
                        [reference.locale]: `() => import('${reference.url}?t=${Date.now()}')`,
                    }),
                    {},
                );

                ctx.type = 'js';
                ctx.body = generateMapping(messagesMap, registerMap, runtimeModuleId);
            }

            // Return the compiled messages module for the requested locale
            if (assets.has(ctx.path)) {
                ctx.type = 'js';
                ctx.body = assets.get(ctx.path);
            }

            await next();
        });
    };

    return {
        rollupInputOptions: {
            plugins: [tradukiRollupPlugin(options)],
        },
        configureServer: serverPlugin,
    };
}

export default createVitePlugin;

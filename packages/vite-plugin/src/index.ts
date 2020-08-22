import {
    defaultKeyHashFn,
    generateImporters,
    generateExportMapping,
    generatePrecompiledMessages,
    parseYaml,
    toMessagesMap,
    transformMessageKeys,
} from '@traduki/build-utils';
import tradukiRollupPlugin, { PluginOptions } from '@traduki/rollup-plugin-traduki';
import path from 'path';
import { Plugin, ServerPlugin } from 'vite';
import { cachedRead } from 'vite/dist/node/utils/fsUtils';
import { createFilter } from '@rollup/pluginutils';

function createVitePlugin(options: PluginOptions = {}): Plugin {
    const config = {
        runtimeModuleId: '@traduki/runtime',
        include: /\.messages\.yaml$/,
        ...options,
    };

    const filter = createFilter(config.include, config.exclude);
    const assets = new Map();

    const serverPlugin: ServerPlugin = ({
        root, // project root directory, absolute path
        app, // Koa app instance
    }) => {
        app.use(async (ctx, next) => {
            // Parse message.yaml and export messages map.
            // As side effect register for each locale the path to the compiled messages module
            if (filter(ctx.path)) {
                const contents = await cachedRead(ctx, path.join(root, ctx.path));
                const dictionaries = await parseYaml(contents.toString());
                const locales = Object.keys(dictionaries);
                const messagesMap = toMessagesMap(dictionaries);
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
                        [reference.locale]: `() => import('${reference.url}?z=${Date.now()}')`,
                    }),
                    {},
                );

                ctx.type = 'js';
                ctx.body = [
                    generateImporters(registerMap, config.runtimeModuleId),
                    generateExportMapping(messagesMap),
                    'if (__traduki.getLocale()) {',
                    '\t__traduki.load();',
                    '}',
                ].join('\n');
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
            plugins: [tradukiRollupPlugin(config)],
        },
        configureServer: serverPlugin,
    };
}

export default createVitePlugin;

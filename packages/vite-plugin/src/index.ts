import lazyLionRollupPlugin from '@lazy-lion/rollup-plugin';
import { toMessagesMap, defaultKeyHashFn } from '@lazy-lion/rollup-plugin/lib/cjs/helpers';
import { Plugin, ServerPlugin } from 'vite';
import { cachedRead } from 'vite/dist/node/utils/fsUtils';
import path from 'path';
import Yaml from 'js-yaml';

type KeyHashArgs = {
    key: string;
    path: string;
};

type PluginOptions = {
    runtimeModuleId?: string | null | false; // TODO: support null and false
    primaryLocale?: string;
    keyHashFn?: (args: KeyHashArgs) => string;
    endsWith?: string;
};

function createVitePlugin(options: PluginOptions = {}): Plugin {
    const {
        runtimeModuleId = '@lazy-lion/runtime',
        primaryLocale = 'en',
        keyHashFn = defaultKeyHashFn,
        endsWith = '.messages.yaml',
    } = options;

    const serverPlugin: ServerPlugin = ({
        root, // project root directory, absolute path
        app, // Koa app instance
        server, // raw http server instance
        watcher, // chokidar file watcher instance
    }) => {
        app.use(async (ctx, next) => {
            if (ctx.path.endsWith(endsWith)) {
                const contents = await cachedRead(ctx, path.join(root, ctx.path));
                const dictionaries = Yaml.load(contents.toString());
                const languages = Object.keys(dictionaries);
                const messages = dictionaries[primaryLocale];
                const messagesMap = toMessagesMap(messages, key =>
                    keyHashFn({
                        key,
                        path: ctx.path,
                    }),
                );

                const references = languages.map(language => {
                    const url = `'${ctx.path}.${language}.js'`;

                    return { language, url };
                });

                const jsonExport = JSON.stringify(messagesMap);
                const registerMap = references
                    .map(ref => `${ref.language}: ${ref.url}`)
                    .join(',');

                ctx.type = 'js';
                ctx.body = `
                    import runtime from '${runtimeModuleId}';

                    runtime.register({${registerMap}});

                    export default ${jsonExport};
                `;
            }

            await next();
        });
    };

    return {
        rollupInputOptions: {
            plugins: [lazyLionRollupPlugin(options)],
        },
        configureServer: serverPlugin,
    };
}

export default createVitePlugin;

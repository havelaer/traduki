import lazyLionRollupPlugin from '@lazy-lion/rollup-plugin';
import {
    defaultKeyHashFn,
    mapMessageKeys,
    toMessagesMap,
} from '@lazy-lion/rollup-plugin/lib/cjs/helpers';
import Yaml from 'js-yaml';
import MessageFormat from 'messageformat';
import path from 'path';
import { Plugin, ServerPlugin } from 'vite';
import { cachedRead } from 'vite/dist/node/utils/fsUtils';

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

    const assets = new Map();

    const serverPlugin: ServerPlugin = ({
        root, // project root directory, absolute path
        app, // Koa app instance
        server, // raw http server instance
        watcher, // chokidar file watcher instance
    }) => {
        app.use(async (ctx, next) => {
            // Parse message.yaml and export messages map.
            // As side effect register for each locale the path to the compiled messages module
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
                    const url = `${ctx.path}.${language}.js`;
                    const messages = mapMessageKeys(dictionaries[language], messagesMap);
                    const messageformat = new MessageFormat(language);
                    const compiled = messageformat.compile(messages).toString('export default');

                    assets.set(url, compiled);

                    return { language, url };
                });

                const jsonExport = JSON.stringify(messagesMap);
                const registerMap = references.map(ref => `${ref.language}: '${ref.url}?t=${Date.now()}'`).join(',');

                ctx.type = 'js';
                ctx.body = [
                    `import runtime from '${runtimeModuleId}';`,
                    `runtime.register({${registerMap}});`,
                    `export default ${jsonExport};`,
                ].join('\n');
            }

            // Return the compiled messages module for the requested locale
            if (assets.has(ctx.path)) {
                const compiled = assets.get(ctx.path);

                ctx.type = 'js';
                ctx.body = compiled;
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

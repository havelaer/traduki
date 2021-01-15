import { createFilter } from '@rollup/pluginutils';
import {
    generateExportMapping,
    generateImporters,
    generatePrecompiledMessages,
    readYaml,
    toMessagesMap,
    transformMessageKeys,
} from '@traduki/build-utils';
import tradukiRollupPlugin, { PluginOptions } from '@traduki/rollup-plugin-traduki';
import { Plugin } from 'vite';
import { RenderedChunk } from 'rollup';

function createVitePlugin(options: PluginOptions = {}): Plugin {
    const pluginOptions = {
        runtimeModuleId: '@traduki/runtime',
        include: /\.messages\.yaml$/,
        ...options,
    };

    let config: any;
    const filter = createFilter(pluginOptions.include, pluginOptions.exclude);
    const hooks = tradukiRollupPlugin(pluginOptions);
    const isServe = () => config.command === 'serve';

    return {
        ...hooks,
        configResolved(resolvedConfig) {
            config = resolvedConfig;
        },
        resolveId(id, importer, options) {
            if (isServe() && filter(id)) return id;

            return hooks.resolveId!.call(this, id, importer, options);
        },
        async load(id) {
            if (isServe() && filter(id)) {
                const dictionaries = await readYaml(id);
                const locales = Object.keys(dictionaries);
                const messagesMap = toMessagesMap(dictionaries);
                const references = locales.map(locale => {
                    const messages = transformMessageKeys(dictionaries[locale], messagesMap);
                    const source = generatePrecompiledMessages(locale, messages, 'cjs').replace(
                        'module.exports = ',
                        'const messages = ',
                    );

                    return { locale, source };
                });

                const registerMap = references.reduce(
                    (map, reference) => ({
                        ...map,
                        [reference.locale]: `() => {${reference.source}; return Promise.resolve(messages); }`,
                    }),
                    {},
                );

                return [
                    generateImporters(registerMap, pluginOptions.runtimeModuleId),
                    generateExportMapping(messagesMap),
                ].join('\n');
            }

            return hooks.load!.call(this, id);
        },
    };
}

export default createVitePlugin;
